// routes/workflowRoutes.js
import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { emailService } from '../services/emailService.js';
import { calendarService } from '../services/calendarService.js';
import { taskService } from '../services/taskService.js'; // Assuming you have a task service
import { getGroqChatCompletion } from '../services/groqService.js';

const router = Router();

router.get('/generate-workflow', authMiddleware, async (req, res) => {
    try {
        const { accessToken } = req.userData;

        // Fetch emails, calendar events, and tasks in parallel
        const [emails, calendarEvents, tasks] = await Promise.all([
            emailService.getEmailsWithDetails(accessToken),
            calendarService.getEvents(accessToken),
            taskService.getTasks(accessToken), // Assuming task service exists
        ]);

        // Prepare the prompt for Groq
        const prompt = `
            Generate a prioritized workflow based on the following data:
            Emails: ${JSON.stringify(emails, null, 2)}
            Calendar Events: ${JSON.stringify(calendarEvents, null, 2)}
            Tasks: ${JSON.stringify(tasks, null, 2)}
            Please prioritize tasks considering deadlines and effort.
        `;

        // Get the workflow from Groq
        const workflow = await getGroqChatCompletion(prompt);

        // Send the response to the frontend
        res.json({ workflow });
    } catch (error) {
        console.error('Error generating workflow:', error.message);
        res.status(500).json({ error: 'Failed to generate workflow.' });
    }
});

export const workflowRoutes = router;
