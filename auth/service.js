import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Session, User, Otp } from './models.js';
import { createLogger } from '../../lib/logger.js';

const logger = createLogger('auth');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function signAccessToken(payload) {
	const secret = process.env.JWT_ACCESS_SECRET;
	const expiresIn = process.env.JWT_ACCESS_EXPIRES || '15m';
	return jwt.sign(payload, secret, { expiresIn });
}

function signRefreshToken(payload) {
	const secret = process.env.JWT_REFRESH_SECRET;
	const expiresIn = process.env.JWT_REFRESH_EXPIRES || '7d';
	return jwt.sign(payload, secret, { expiresIn });
}

export async function hashToken(token) {
	return crypto.createHash('sha256').update(token).digest('hex');
}

export async function registerUser({ name, email, password }) {
	const existing = await User.findOne({ email });
	if (existing) {
		throw new Error('Email already registered');
	}
	const passwordHash = await bcrypt.hash(password, 10);
	const user = await User.create({ name, email, passwordHash, role: 'customer' });
	return { id: user._id, name: user.name, email: user.email, role: user.role };
}

export async function loginUser({ email, password, ua, ip }) {
	const user = await User.findOne({ email });
	if (!user) throw new Error('Invalid credentials');
	const ok = await bcrypt.compare(password, user.passwordHash);
	if (!ok) throw new Error('Invalid credentials');

	const jti = crypto.randomUUID();
	const accessToken = signAccessToken({ sub: String(user._id), role: user.role });
	const refreshToken = signRefreshToken({ sub: String(user._id), jti });
	const refreshTokenHash = await hashToken(refreshToken);
	const expiresAt = new Date(Date.now() + parseJwtExpiryMs(process.env.JWT_REFRESH_EXPIRES || '7d'));
	await Session.create({ userId: user._id, refreshTokenHash, jti, ua, ip, expiresAt });
	return { accessToken, refreshToken, expiresIn: 900 };
}

export async function refreshTokens({ refreshToken, ua, ip }) {
	const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
	const { sub: userId, jti } = decoded;
	const session = await Session.findOne({ jti, userId });
	if (!session) {
		throw Object.assign(new Error('Session not found'), { code: 'INVALID_SESSION' });
	}
	const incomingHash = await hashToken(refreshToken);
	if (incomingHash !== session.refreshTokenHash) {
		// reuse detected
		await Session.deleteMany({ userId });
		const err = new Error('Refresh token reuse detected');
		err.code = 'REFRESH_TOKEN_REUSE_DETECTED';
		throw err;
	}
	// rotate
	const newJti = crypto.randomUUID();
	const accessToken = signAccessToken({ sub: String(userId), role: undefined });
	const newRefreshToken = signRefreshToken({ sub: String(userId), jti: newJti });
	const newRefreshHash = await hashToken(newRefreshToken);
	await Session.updateOne({ _id: session._id }, { refreshTokenHash: newRefreshHash, jti: newJti, rotatedAt: new Date() });
	return { accessToken, refreshToken: newRefreshToken, expiresIn: 900 };
}

export async function logout({ refreshToken }) {
	try {
		const { jti } = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
		await Session.deleteOne({ jti });
	} catch {
		// ignore
	}
	return { ok: true };
}

export async function createOtp({ email }) {
	const code = String(Math.floor(100000 + Math.random() * 900000));
	const otpHash = await bcrypt.hash(code, 10);
	const ttl = parseInt(process.env.OTP_EXPIRY_SECONDS || '300', 10) * 1000;
	const expiresAt = new Date(Date.now() + ttl);
	await Otp.deleteMany({ email });
	await Otp.create({ email, otpHash, expiresAt });
	const logPath = path.join(__dirname, '../../../tmp/otps.log');
	fs.mkdirSync(path.dirname(logPath), { recursive: true });
	fs.appendFileSync(logPath, `${new Date().toISOString()} ${email} ${code}\n`);
	logger.info({ msg: 'OTP issued', module: 'auth', details: { email } });
	// dev-stub: also log to console via logger
	return { ok: true };
}

export async function verifyOtpAndReset({ email, otp, newPassword }) {
	const record = await Otp.findOne({ email });
	if (!record) throw new Error('OTP not found');
	if (record.expiresAt.getTime() < Date.now()) throw new Error('OTP expired');
	const ok = await bcrypt.compare(otp, record.otpHash);
	if (!ok) throw new Error('Invalid OTP');
	const passwordHash = await bcrypt.hash(newPassword, 10);
	await User.updateOne({ email }, { passwordHash });
	await Otp.deleteMany({ email });
	return { ok: true };
}

function parseJwtExpiryMs(spec) {
	// supports s, m, h, d
	const m = /^(\d+)([smhd])$/.exec(spec);
	if (!m) return 7 * 24 * 60 * 60 * 1000;
	const n = parseInt(m[1], 10);
	const unit = m[2];
	if (unit === 's') return n * 1000;
	if (unit === 'm') return n * 60 * 1000;
	if (unit === 'h') return n * 60 * 60 * 1000;
	return n * 24 * 60 * 60 * 1000;
}


