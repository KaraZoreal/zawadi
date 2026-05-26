import express from 'express';
import scholarshipsRouter from './scholarships.js';
import authRouter from './auth.js';

const router = express.Router();

// Public routes
router.use('/scholarships', scholarshipsRouter);
router.use('/auth', authRouter);

export default router;
