const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();

const adminUser = {
  id: 1,
  name: "Admin",
  email: "admin@ghc.com",
  role: "SUPER_ADMIN",
  permissions: ["dashboard.view", "users.manage", "speakers.manage", "workshops.manage", "research.manage", "partners.manage", "media.manage", "settings.manage"],
};

router.get("/me", (req, res) => {
  res.json(adminUser);
});

router.post("/login", (req, res) => {
  const token = jwt.sign(adminUser, process.env.JWT_SECRET || "change-this-secret", { expiresIn: process.env.JWT_EXPIRES_IN || "15m" });
  const refreshToken = jwt.sign({ id: adminUser.id, type: "refresh" }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "change-this-secret", { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "30d" });
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
    user: adminUser,
  });
});

router.post("/refresh", (req, res) => {
  const incoming = req.cookies?.refresh_token || req.body.refreshToken;
  try {
    jwt.verify(incoming, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "change-this-secret");
    const token = jwt.sign(adminUser, process.env.JWT_SECRET || "change-this-secret", { expiresIn: process.env.JWT_EXPIRES_IN || "15m" });
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60 * 1000,
    });
    return res.json({ token, user: adminUser });
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
