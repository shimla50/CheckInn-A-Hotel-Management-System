import mongoose from 'mongoose';

export const Service = mongoose.model(
	'Service',
	new mongoose.Schema(
		{
			name: { type: String, required: true },
			description: String,
			price: { type: Number, required: true },
			taxRate: { type: Number, default: 0 }
		},
		{ timestamps: { createdAt: true, updatedAt: false } }
	)
);


