import express from 'express';
import { Service } from './models.js';

const router = express.Router();

router.get('/', async (req, res) => {
	const items = await Service.find({}).lean();
	return res.json({ success: true, data: items });
});

export default router;


