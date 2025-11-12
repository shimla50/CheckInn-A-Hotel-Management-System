import express from 'express';
import { Invoice, Transaction } from './models.js';

const router = express.Router();

router.post('/invoices', async (req, res) => {
	const { bookingId, stayId, lines = [], currency = 'BDT' } = req.body;
	const subtotal = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
	const tax = lines.reduce((s, l) => s + l.qty * l.unitPrice * (l.taxRate || 0), 0);
	const total = Math.round((subtotal + tax) * 100) / 100;
	const invoice = await Invoice.create({ bookingId, stayId, lines, subtotal, tax, total, currency, status: 'unpaid' });
	return res.status(201).json({ success: true, data: invoice });
});

router.post('/payments', async (req, res) => {
	const { invoiceId, provider = 'stub', providerTxId, amount } = req.body;
	const tx = await Transaction.create({ invoiceId, provider, providerTxId, amount, status: 'succeeded' });
	await Invoice.updateOne({ _id: invoiceId }, { status: 'paid' });
	return res.status(201).json({ success: true, data: tx });
});

export default router;


