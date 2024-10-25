import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/google/url', authController.getAuthUrl.bind(authController));
router.get(
    '/google/callback',
    authController.handleCallback.bind(authController)
);
router.post(
    '/refresh-token',
    authMiddleware,
    authController.refreshToken.bind(authController)
);
router.get(
    '/profile',
    authMiddleware,
    authController.getUserProfile.bind(authController)
);
router.post(
    '/logout',
    authMiddleware,
    authController.logout.bind(authController)
);

export const authRoutes = router;
