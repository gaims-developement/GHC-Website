const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { pool } = require("../config/db");
const ActivityLog = require("../models/activityLogModel");
const User = require("../models/userModel");
const router = express.Router();

const signToken = (user) => jwt.sign(User.serialize(user), process.env.JWT_SECRET || "change-this-secret", { expiresIn: process.env.JWT_EXPIRES_IN || "15m" });

const getTokenFromRequest = (req) => {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7);
  return req.cookies?.token;
};

const parseAgent = (agent = "") => {
  const browser = agent.includes("Edg/") ? "Edge" : agent.includes("Chrome/") ? "Chrome" : agent.includes("Firefox/") ? "Firefox" : agent.includes("Safari/") ? "Safari" : "Unknown";
  const device = /Mobile|Android|iPhone|iPad/i.test(agent) ? "Mobile" : "Desktop";
  return { browser, device };
};

const tokenFingerprint = (token) => crypto.createHash("sha256").update(token).digest("hex");

const writeLoginLog = async (req, { userId = null, email, status }) => {
  const { browser, device } = parseAgent(req.headers["user-agent"] || "");
  await pool.query(
    "INSERT INTO login_logs (user_id, email, ip_address, device, browser, location, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [userId, email, req.ip || req.socket?.remoteAddress || null, device, browser, null, status]
  );
};

router.get("/me", async (req, res) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "change-this-secret");
    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(User.serialize(user));
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = email ? await User.findByEmail(email) : null;
  const passwordMatches = user ? await bcrypt.compare(password || "", user.password_hash) : false;

  if (!passwordMatches) {
    await writeLoginLog(req, { userId: user?.id || null, email, status: "failed" });
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (user.is_active === false || user.is_active === 0 || user.is_locked === true || user.is_locked === 1) {
    await writeLoginLog(req, { userId: user.id, email, status: "failed" });
    return res.status(403).json({ message: "Account is inactive" });
  }

  const serializedUser = User.serialize(user);
  const token = signToken(user);
  const refreshToken = jwt.sign({ id: user.id, type: "refresh" }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "change-this-secret", { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "30d" });
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  await ActivityLog.logActivity({
    userId: user.id,
    action: "user_login",
    module: "auth",
    recordId: String(user.id),
  });
  await writeLoginLog(req, { userId: user.id, email, status: "success" });
  await pool.query(
    "INSERT INTO active_sessions (user_id, session_token, ip_address, device, expires_at) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))",
    [user.id, tokenFingerprint(token), req.ip || req.socket?.remoteAddress || null, parseAgent(req.headers["user-agent"] || "").device]
  );
  await pool.query(
    "INSERT INTO audit_logs (user_id, action, module, record_type, record_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [user.id, "login", "auth", "user", user.id, req.ip || req.socket?.remoteAddress || null, req.headers["user-agent"] || null]
  );

  res.json({
    success: true,
    token,
    refreshToken,
    user: serializedUser,
  });
});

router.post("/refresh", async (req, res) => {
  const incoming = req.cookies?.refresh_token || req.body.refreshToken;
  try {
    const payload = jwt.verify(incoming, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "change-this-secret");
    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const token = signToken(user);
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60 * 1000,
    });
    return res.json({ token, user: User.serialize(user) });
  } catch {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
});

router.post("/register", (req, res) => {
  res.json({
    success: true,
  });
});

router.post("/logout", async (req, res) => {
  const token = getTokenFromRequest(req);
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || "change-this-secret");
      await pool.query("DELETE FROM active_sessions WHERE session_token = ?", [tokenFingerprint(token)]);
      await pool.query(
        "INSERT INTO audit_logs (user_id, action, module, record_type, record_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [payload.id, "logout", "auth", "user", payload.id, req.ip || req.socket?.remoteAddress || null, req.headers["user-agent"] || null]
      );
      await ActivityLog.logActivity({
        userId: payload.id,
        action: "user_logout",
        module: "auth",
        recordId: String(payload.id),
        metadata: payload.impersonatorId ? { impersonatorId: payload.impersonatorId } : null,
      });
    } catch {
      // Logout should clear the client session even when a stale token is present.
    }
  }

  res.clearCookie("token");
  res.clearCookie("refresh_token");
  res.json({
    success: true,
  });
});

module.exports = router;
