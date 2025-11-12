import express from 'express';
import mongoose from 'mongoose';
import { Booking } from './models.js';
import { Room, RoomType } from '../rooms/models.js';

const router = express.Router();

router.post('/', async (req, res, next) => {
	const { userId, roomTypeId, from, to, guests, extras } = req.body;
	const session = await mongoose.startSession();
	try {
		await session.withTransaction(async () => {
			const fromDate = new Date(from);
			const toDate = new Date(to);
			const totalRooms = await Room.countDocuments({ typeId: roomTypeId }).session(session);
			const reserved = await Booking.countDocuments({
				roomTypeId,
				status: { $in: ['confirmed', 'checked_in'] },
				from: { $lt: toDate },
				to: { $gt: fromDate }
			}).session(session);
			if (reserved >= totalRooms) {
				const err = new Error('No availability');
				err.status = 409;
				err.code = 'NO_AVAILABILITY';
				throw err;
			}
			const rt = await RoomType.findById(roomTypeId).session(session);
			const nights = Math.ceil((toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000));
			const totalAmount = nights * (rt.basePrice || 0);
			const booking = await Booking.create(
				[
					{
						userId,
						roomTypeId,
						from: fromDate,
						to: toDate,
						guests,
						extras: extras || [],
						totalAmount,
						status: 'confirmed'
					}
				],
				{ session }
			);
			res.status(201).json({ success: true, data: { bookingId: booking[0]._id, status: booking[0].status } });
		});
	} catch (err) {
		if (!res.headersSent) next(err);
	} finally {
		await session.endSession();
	}
});

export default router;


