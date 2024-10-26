// routes/workflowRoutes.js
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { emailService } from '../services/emailService.js';
import { calendarService } from '../services/calendarService.js';
import { User } from '../models/User.js'; // Ensure User model is correctly imported
import { getGroqChatCompletion } from '../services/groqConnection.js';

const router = Router();

router.get('/generate-workflow', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.user; // Extract userId from the decoded JWT token

        // Fetch the user from the database and populate tasks
        const user = await User.findById(userId).populate('tasks');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Fetch emails and calendar events using the access token
        const emails = await emailService.getEmailsWithDetails(
            user.accessToken
        );
        const calendarEvents = await calendarService.getEvents(
            user.accessToken
        );
        const tasks = user.tasks; // Populated tasks from the user model

        // Create a prompt with fetched data for the Groq API
        const prompt = `
            Emails: ${JSON.stringify(emails)}
            Calendar Events: ${JSON.stringify(calendarEvents)}
            Tasks: ${JSON.stringify(tasks)}
        `;

        // Get workflow output from the Groq API
        const workflow = await getGroqChatCompletion(prompt);

        // Send the generated workflow to the frontend
        res.json({ workflow });
    } catch (error) {
        console.error('Error generating workflow:', error.message);
        res.status(500).json({ error: error.message });
    }
});

export const workflowRoutes = router;
