const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../config/db');
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

const parseAgent = (agent = '') => {
  const browser = agent.includes('Edg/') ? 'Edge' : agent.includes('Chrome/') ? 'Chrome' : agent.includes('Firefox/') ? 'Firefox' : agent.includes('Safari/') ? 'Safari' : 'Unknown';
  const device = /Mobile|Android|iPhone|iPad/i.test(agent) ? 'Mobile' : 'Desktop';
  return { browser, device };
};

const tokenFingerprint = (token) => crypto.createHash('sha256').update(token).digest('hex');

const writeLoginLog = async (req, { userId = null, email, status }) => {
  const { browser, device } = parseAgent(req.headers['user-agent'] || '');
  await pool.query(
    'INSERT INTO login_logs (user_id, email, ip_address, device, browser, location, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [userId, email, req.ip || req.socket?.remoteAddress || null, device, browser, null, status]
  );
};

const sendAuth = async (req, res, user) => {
  const token = signToken(user);
  const { device } = parseAgent(req.headers['user-agent'] || '');
  await pool.query(
    'INSERT INTO active_sessions (user_id, session_token, ip_address, device, expires_at) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))',
    [user.id, tokenFingerprint(token), req.ip || req.socket?.remoteAddress || null, device]
  );
  await pool.query(
    'INSERT INTO audit_logs (user_id, action, module, record_type, record_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [user.id, 'login', 'auth', 'user', user.id, req.ip || req.socket?.remoteAddress || null, req.headers['user-agent'] || null]
  );
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
    await writeLoginLog(req, { userId: user?.id || null, email, status: 'failed' });
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (user.is_active === false || user.is_active === 0 || user.is_locked === true || user.is_locked === 1) {
    await writeLoginLog(req, { userId: user.id, email, status: 'failed' });
    return res.status(403).json({ message: 'This account is not active' });
  }

  await writeLoginLog(req, { userId: user.id, email, status: 'success' });
  return sendAuth(req, res, user);
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json({ user: User.serialize(user) });
});

const logout = asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : req.cookies?.token;
  if (token) {
    await pool.query('DELETE FROM active_sessions WHERE session_token = ?', [tokenFingerprint(token)]);
  }
  if (req.user?.id) {
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, module, record_type, record_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, 'logout', 'auth', 'user', req.user.id, req.ip || req.socket?.remoteAddress || null, req.headers['user-agent'] || null]
    );
  }
  res.clearCookie('token', cookieOptions);
  return res.json({ message: 'Logged out' });
});

module.exports = { register, login, me, logout };
