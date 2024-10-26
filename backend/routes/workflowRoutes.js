import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { emailService } from '../services/emailService.js';
import { calendarService } from '../services/calendarService.js';
import { User } from '../models/User.js';
import { getGroqChatCompletion } from '../services/groqConnection.js';

const router = Router();

// Helper function to validate workflow response structure
const validateWorkflowResponse = (workflow) => {
    const requiredFields = [
        'morningTasks',
        'afternoonTasks',
        'eveningTasks',
        'totalTasksToday',
        'urgentTasks',
        'importantMeetings',
    ];
    const taskFields = [
        'time',
        'description',
        'duration',
        'priority',
        'action',
        'source',
    ];

    // Check if all required top-level fields exist
    const hasAllFields = requiredFields.every((field) =>
        workflow.hasOwnProperty(field)
    );
    if (!hasAllFields) return false;

    // Validate tasks in each time block
    const validateTasks = (tasks) => {
        if (!Array.isArray(tasks)) return false;
        return tasks.every((task) =>
            taskFields.every((field) => task.hasOwnProperty(field))
        );
    };

    return (
        validateTasks(workflow.morningTasks) &&
        validateTasks(workflow.afternoonTasks) &&
        validateTasks(workflow.eveningTasks)
    );
};

// Helper function to format the prompt with specific output instructions
const createWorkflowPrompt = (emails, calendarEvents, tasks) => {
    return `As a daily workflow assistant, analyze the provided data and create a structured daily schedule. 
    
    IMPORTANT: Return a JSON object that organizes tasks throughout the day. Format:
    {
        "morningTasks": [
            {
                "time": "9:00 AM",
                "description": "Task description",
                "duration": "30m",
                "priority": "high",
                "action": "specific action needed",
                "source": "email/calendar/task"
            }
        ],
        "afternoonTasks": [
            {
                "time": "2:00 PM",
                "description": "Task description",
                "duration": "1h",
                "priority": "medium",
                "action": "action needed",
                "source": "email/calendar/task"
            }
        ],
        "eveningTasks": [
            {
                "time": "4:00 PM",
                "description": "Task description",
                "duration": "45m",
                "priority": "low",
                "action": "action needed",
                "source": "email/calendar/task"
            }
        ],
        "totalTasksToday": 5,
        "urgentTasks": 2,
        "importantMeetings": [
            {
                "time": "11:00 AM",
                "description": "Meeting description",
                "duration": "1h",
                "participants": ["Person1", "Person2"]
            }
        ]
    }

    Rules:
    1. Morning tasks: 9 AM - 12 PM
    2. Afternoon tasks: 12 PM - 4 PM
    3. Evening tasks: 4 PM - 6 PM
    4. Prioritize urgent emails and calendar events
    5. Consider task dependencies and deadlines
    6. Include brief breaks between tasks
    7. Use 24-hour time format
    8. Duration should be in minutes (e.g., "30m", "1h", "45m")
    9. Priority levels: "low", "medium", "high", "urgent"

    Analyze this data to create the schedule:
    Emails: ${JSON.stringify(emails)}
    Calendar Events: ${JSON.stringify(calendarEvents)}
    Tasks: ${JSON.stringify(tasks)}`;
};

// Helper function to clean and parse the LLM response
const parseAndValidateResponse = (response) => {
    console.log('Raw LLM Response:', response);

    try {
        // Clean up the response string
        let cleanResponse = response
            .replace(/\n/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        // Remove any markdown code block indicators
        cleanResponse = cleanResponse.replace(/^```json\s*|\s*```$/g, '');

        const jsonMatch = cleanResponse.match(/\{.*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON object found in response');
        }

        let parsedResponse = JSON.parse(jsonMatch[0]);

        // Apply default values and structure if needed
        const defaultTask = {
            time: '',
            description: '',
            duration: '30m',
            priority: 'medium',
            action: 'review',
            source: 'task',
        };

        // Ensure all task arrays exist and have valid structure
        ['morningTasks', 'afternoonTasks', 'eveningTasks'].forEach(
            (timeBlock) => {
                if (!Array.isArray(parsedResponse[timeBlock])) {
                    parsedResponse[timeBlock] = [];
                }
                parsedResponse[timeBlock] = parsedResponse[timeBlock].map(
                    (task) => ({
                        ...defaultTask,
                        ...task,
                    })
                );
            }
        );

        // Ensure other required fields exist
        parsedResponse = {
            ...parsedResponse,
            totalTasksToday: parsedResponse.totalTasksToday || 0,
            urgentTasks: parsedResponse.urgentTasks || 0,
            importantMeetings: Array.isArray(parsedResponse.importantMeetings)
                ? parsedResponse.importantMeetings
                : [],
        };

        if (validateWorkflowResponse(parsedResponse)) {
            return parsedResponse;
        } else {
            throw new Error('Response structure is invalid');
        }
    } catch (error) {
        console.error('JSON Parsing Error:', error);
        console.error('Attempted to parse:', response);

        // Return a fallback response
        return {
            morningTasks: [
                {
                    time: '9:00 AM',
                    description: 'Review daily schedule',
                    duration: '30m',
                    priority: 'medium',
                    action: 'review',
                    source: 'system',
                },
            ],
            afternoonTasks: [],
            eveningTasks: [],
            totalTasksToday: 1,
            urgentTasks: 0,
            importantMeetings: [],
        };
    }
};

router.get('/generate-workflow', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.user;

        // Fetch user and related data
        const user = await User.findById(userId).populate('tasks');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Fetch emails and calendar events
        const emails = await emailService.getEmailsWithDetails(
            user.accessToken
        );
        const calendarEvents = await calendarService.getEvents(
            user.accessToken
        );
        const tasks = user.tasks;

        // Generate the structured prompt
        const prompt = createWorkflowPrompt(emails, calendarEvents, tasks);

        // Get workflow from Groq API
        const workflowResponse = await getGroqChatCompletion(prompt);

        // Parse and validate the response
        const parsedWorkflow = parseAndValidateResponse(workflowResponse);

        // Send the validated workflow response
        res.json({
            success: true,
            workflow: parsedWorkflow,
        });
    } catch (error) {
        console.error('Error generating workflow:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: 'Failed to generate daily workflow summary',
        });
    }
});

export const workflowRoutes = router;
