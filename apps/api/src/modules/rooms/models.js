import mongoose from 'mongoose';

export const RoomType = mongoose.model(
	'RoomType',
	new mongoose.Schema(
		{
			name: { type: String, required: true },
			description: String,
			capacity: { type: Number, required: true },
			basePrice: { type: Number, required: true },
			amenities: [{ type: String }],
			defaultOccupancy: { type: Number, default: 1 }
		},
		{ timestamps: { createdAt: true, updatedAt: false } }
	)
);

export const Room = mongoose.model(
	'Room',
	new mongoose.Schema({
		roomNumber: { type: String, required: true, unique: true },
		floor: Number,
		typeId: { type: mongoose.Types.ObjectId, ref: 'RoomType', required: true, index: true },
		pricePerNight: Number,
		status: { type: String, enum: ['available', 'occupied', 'blocked', 'maintenance'], default: 'available' },
		images: [String],
		tags: [String]
	})
);


