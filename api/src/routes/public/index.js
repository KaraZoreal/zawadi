import express from 'express';
import scholarshipsRouter from './scholarships.js';
import authRouter from './auth.js';
import paymentRouter from './payment.js';

const router = express.Router();

// Public routes
router.use('/scholarships', scholarshipsRouter);
router.use('/auth', authRouter);
router.use('/payment', paymentRouter);

export default router;
