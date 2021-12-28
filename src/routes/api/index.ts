import express from 'express';
import problemRouter from './problem';

const router = express.Router();
router.use('/problem', problemRouter);

export default router;
