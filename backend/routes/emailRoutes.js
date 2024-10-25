import { Router } from 'express';
import { emailController } from '../controllers/emailController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get(
    '/',
    authMiddleware,
    emailController.getEmails.bind(emailController)
);

export const emailRoutes = router;
