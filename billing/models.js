import mongoose from 'mongoose';

export const Invoice = mongoose.model(
	'Invoice',
	new mongoose.Schema(
		{
			bookingId: { type: mongoose.Types.ObjectId, ref: 'Booking' },
			stayId: { type: mongoose.Types.ObjectId, ref: 'Stay' },
			lines: [{ desc: String, qty: Number, unitPrice: Number, taxRate: Number }],
			subtotal: Number,
			tax: Number,
			total: Number,
			currency: { type: String, default: 'BDT' },
			status: { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' }
		},
		{ timestamps: { createdAt: true, updatedAt: false } }
	)
);

export const Transaction = mongoose.model(
	'Transaction',
	new mongoose.Schema(
		{
			invoiceId: { type: mongoose.Types.ObjectId, ref: 'Invoice', required: true },
			provider: { type: String, default: 'stub' },
			providerTxId: String,
			amount: Number,
			status: { type: String, enum: ['succeeded', 'failed', 'pending'], default: 'succeeded' }
		},
		{ timestamps: { createdAt: true, updatedAt: false } }
	)
);


