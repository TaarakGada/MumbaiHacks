import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { authRoutes } from './routes/authRoutes.js';
import { emailRoutes } from './routes/emailRoutes.js';
import { calendarRoutes } from './routes/calendarRoutes.js';
import { taskRoutes } from './routes/taskRoutes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/calendar', calendarRoutes);
// app.use('/api/workflow', workflowRoutes);
app.use('/api/task', taskRoutes);

const PORT = process.env.PORT || 3000;

(async () => {
    try {
        await connectDB(); // Connect to the database
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Error starting server:', error);
    }
})();
