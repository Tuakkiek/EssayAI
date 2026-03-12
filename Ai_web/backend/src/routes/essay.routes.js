import express from 'express';
import { processEssayGrading } from '../controllers/essay.controller.js';

const router = express.Router();

// Tên endpoint rõ ràng: /api/v1/essays/grade
router.post('/grade', processEssayGrading);

export default router;