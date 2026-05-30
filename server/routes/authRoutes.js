const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const router = express.Router();

const signToken = (user) => jwt.sign(User.serialize(user), process.env.JWT_SECRET || "change-this-secret", { expiresIn: process.env.JWT_EXPIRES_IN || "15m" });

const getTokenFromRequest = (req) => {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7);
  return req.cookies?.token;
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
    return res.status(401).json({ message: "Invalid credentials" });
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

router.post("/logout", (req, res) => {
  res.json({
    success: true,
  });
});

module.exports = router;
