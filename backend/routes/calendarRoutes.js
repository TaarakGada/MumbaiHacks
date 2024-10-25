import { Router } from 'express';
import { calendarService } from '../services/calendarService.js';
import { User } from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js'; // Import your auth middleware

const router = Router();

// Apply the authMiddleware to protect the routes
router.get('/events', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const events = await calendarService.getEvents(
            user.accessToken,
            req.query.timeMin,
            req.query.timeMax
        );
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/events', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const event = await calendarService.createEvent(
            user.accessToken,
            req.body
        );
        res.json(event);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export const calendarRoutes = router;
