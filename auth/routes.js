import express from 'express';
import { loginSchema, registerSchema, requestResetSchema, verifyOtpSchema } from '../../lib/validators.js';
import { ApiError } from '../../lib/errors.js';
import { createOtp, loginUser, logout, refreshTokens, registerUser, verifyOtpAndReset } from './service.js';

const router = express.Router();

router.post('/register', async (req, res, next) => {
	try {
		const { error, value } = registerSchema.validate(req.body);
		if (error) throw new ApiError(400, 'VALIDATION_ERROR', error.message);
		const data = await registerUser(value);
		return res.status(201).json({ success: true, data });
	} catch (err) {
		return next(err);
	}
});

router.post('/login', async (req, res, next) => {
	try {
		const { error, value } = loginSchema.validate(req.body);
		if (error) throw new ApiError(400, 'VALIDATION_ERROR', error.message);
		const data = await loginUser({ ...value, ua: req.headers['user-agent'], ip: req.ip });
		return res.json({ success: true, data });
	} catch (err) {
		return next(new ApiError(401, 'INVALID_CREDENTIALS', err.message));
	}
});

router.post('/refresh', async (req, res, next) => {
	try {
		const { refreshToken } = req.body || {};
		if (!refreshToken) throw new ApiError(400, 'VALIDATION_ERROR', 'refreshToken required');
		const data = await refreshTokens({ refreshToken, ua: req.headers['user-agent'], ip: req.ip });
		return res.json({ success: true, data });
	} catch (err) {
		if (err.code === 'REFRESH_TOKEN_REUSE_DETECTED') {
			return next(new ApiError(401, 'REFRESH_TOKEN_REUSE_DETECTED', 'Token reuse detected'));
		}
		return next(new ApiError(401, 'INVALID_REFRESH', err.message));
	}
});

router.post('/logout', async (req, res, next) => {
	try {
		const { refreshToken } = req.body || {};
		if (!refreshToken) throw new ApiError(400, 'VALIDATION_ERROR', 'refreshToken required');
		await logout({ refreshToken });
		return res.json({ success: true, data: { ok: true } });
	} catch (err) {
		return next(err);
	}
});

router.post('/otp/request-reset', async (req, res, next) => {
	try {
		const { error, value } = requestResetSchema.validate(req.body);
		if (error) throw new ApiError(400, 'VALIDATION_ERROR', error.message);
		await createOtp(value);
		return res.json({ success: true, data: { ok: true } });
	} catch (err) {
		return next(err);
	}
});

router.post('/otp/verify', async (req, res, next) => {
	try {
		const { error, value } = verifyOtpSchema.validate(req.body);
		if (error) throw new ApiError(400, 'VALIDATION_ERROR', error.message);
		await verifyOtpAndReset(value);
		return res.json({ success: true, data: { ok: true } });
	} catch (err) {
		return next(err);
	}
});

export default router;


