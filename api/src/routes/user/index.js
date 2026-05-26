import express from 'express';
import { fetchSubscription, getLimits, requirePlan } from '../../middleware/subscription.js';
import profileRouter from './profile.js';
import essaysRouter from './essays.js';
import applicationsRouter from './applications.js';

const router = express.Router();

// Fetch subscription for all user routes
router.use(fetchSubscription);

// Mount sub-routers
router.use('/profile', profileRouter);
router.use('/essays', essaysRouter);
router.use('/applications', applicationsRouter);

export default router;
