import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, maxlength: 120 },
		email: { type: String, required: true, unique: true, index: true },
		passwordHash: { type: String, required: true },
		role: { type: String, enum: ['admin', 'staff', 'customer'], default: 'customer', index: true },
		status: { type: String, enum: ['active', 'suspended', 'deleted'], default: 'active' }
	},
	{ timestamps: true }
);

const sessionSchema = new mongoose.Schema(
	{
		userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true, index: true },
		refreshTokenHash: { type: String, required: true },
		jti: { type: String, required: true, unique: true, index: true },
		ua: String,
		ip: String,
		expiresAt: { type: Date, required: true, index: true },
		rotatedAt: Date,
		createdAt: { type: Date, default: Date.now }
	},
	{ versionKey: false }
);

const otpSchema = new mongoose.Schema(
	{
		email: { type: String, required: true, index: true },
		otpHash: { type: String, required: true },
		expiresAt: { type: Date, required: true },
		attempts: { type: Number, default: 0 }
	},
	{ timestamps: true }
);

export const User = mongoose.model('User', userSchema);
export const Session = mongoose.model('Session', sessionSchema);
export const Otp = mongoose.model('Otp', otpSchema);


