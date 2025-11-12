import express from 'express';
import { Room, RoomType } from './models.js';
import { Booking } from '../bookings/models.js';
import mongoose from 'mongoose';

const router = express.Router();

router.get('/', async (req, res) => {
	const { type, from, to } = req.query;
	const roomTypes = await RoomType.find(type ? { name: type } : {}).lean();
	const fromDate = from ? new Date(from) : null;
	const toDate = to ? new Date(to) : null;
	const result = [];
	for (const rt of roomTypes) {
		const total = await Room.countDocuments({ typeId: rt._id });
		let reserved = 0;
		if (fromDate && toDate) {
			reserved = await Booking.countDocuments({
				roomTypeId: rt._id,
				status: { $in: ['confirmed', 'checked_in'] },
				from: { $lt: toDate },
				to: { $gt: fromDate }
			});
		}
		result.push({ roomTypeId: rt._id, name: rt.name, availableCount: Math.max(0, total - reserved) });
	}
	return res.json({ success: true, data: result });
});

router.get('/availability', async (req, res) => {
	const { from, to } = req.query;
	const fromDate = new Date(from);
	const toDate = new Date(to);
	const types = await RoomType.find({}).lean();
	const out = [];
	for (const rt of types) {
		const total = await Room.countDocuments({ typeId: rt._id });
		const reserved = await Booking.countDocuments({
			roomTypeId: rt._id,
			status: { $in: ['confirmed', 'checked_in'] },
			from: { $lt: toDate },
			to: { $gt: fromDate }
		});
		out.push({ roomTypeId: rt._id, name: rt.name, available: Math.max(0, total - reserved) });
	}
	return res.json({ success: true, data: out });
});

router.post('/', async (req, res) => {
	const room = await Room.create(req.body);
	return res.status(201).json({ success: true, data: room });
});

router.patch('/:id', async (req, res) => {
	const room = await Room.findByIdAndUpdate(new mongoose.Types.ObjectId(req.params.id), req.body, { new: true });
	return res.json({ success: true, data: room });
});

export default router;


