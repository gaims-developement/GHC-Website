const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const asyncHandler = require('../utils/asyncHandler');

const cookieOptions = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const signToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      role: user.role,
      permissions: user.permissions || [],
    },
    process.env.JWT_SECRET || 'change-this-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const sendAuth = (res, user) => {
  const token = signToken(user);
  res.cookie('token', token, cookieOptions);
  return res.json({ token, user: User.serialize(user) });
};

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'ADMIN' } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    return res.status(409).json({ message: 'Email is already registered' });
  }

  const roleRecord = await User.getRoleByName(role);
  if (!roleRecord) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const userId = await User.create({ name, email, passwordHash, roleId: roleRecord.id });
  const user = await User.findById(userId);

  return res.status(201).json({ token: signToken(user), user: User.serialize(user) });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findByEmail(email);
  const isValid = user ? await bcrypt.compare(password, user.password_hash) : false;

  if (!isValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  return sendAuth(res, user);
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json({ user: User.serialize(user) });
});

const logout = asyncHandler(async (_req, res) => {
  res.clearCookie('token', cookieOptions);
  return res.json({ message: 'Logged out' });
});

module.exports = { register, login, me, logout };
