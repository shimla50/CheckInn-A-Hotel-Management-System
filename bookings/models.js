import mongoose from 'mongoose';

export const Booking = mongoose.model(
	'Booking',
	new mongoose.Schema(
		{
			userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
			roomTypeId: { type: mongoose.Types.ObjectId, ref: 'RoomType', required: true },
			allocatedRoomId: { type: mongoose.Types.ObjectId, ref: 'Room', default: null },
			from: { type: Date, required: true, index: true },
			to: { type: Date, required: true, index: true },
			guests: { type: Number, default: 1 },
			extras: [{ serviceId: mongoose.Types.ObjectId, qty: Number, price: Number }],
			totalAmount: Number,
			currency: { type: String, default: 'BDT' },
			status: {
				type: String,
				enum: ['requested', 'approved', 'confirmed', 'cancelled', 'checked_in', 'checked_out'],
				default: 'confirmed',
				index: true
			}
		},
		{ timestamps: true }
	)
);

export const Stay = mongoose.model(
	'Stay',
	new mongoose.Schema({
		bookingId: { type: mongoose.Types.ObjectId, ref: 'Booking', required: true },
		allocatedRoomId: { type: mongoose.Types.ObjectId, ref: 'Room', required: true },
		actualCheckin: Date,
		actualCheckout: Date,
		staffId: { type: mongoose.Types.ObjectId, ref: 'User' },
		extraCharges: [{ desc: String, amount: Number }],
		status: { type: String, enum: ['active', 'completed', 'disputed'], default: 'active' }
	})
);


