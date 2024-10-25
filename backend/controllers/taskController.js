// controllers/taskController.js
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';

class TaskController {
    // Create a new task and associate it with a user
    async createTask(req, res) {
        try {
            const { title, content, dueDate, priority, tags, status } =
                req.body;
            const userId = req.user.userId;

            const newTask = await Task.create({
                title,
                content,
                dueDate,
                priority,
                tags,
                status,
            });

            // Associate the task with the user
            const user = await User.findById(userId);
            if (!user)
                return res.status(404).json({ message: 'User not found' });

            user.tasks.push(newTask._id);
            await user.save();

            res.status(201).json({
                message: 'Task created successfully',
                task: newTask,
            });
        } catch (error) {
            console.error('Error creating task:', error);
            res.status(500).json({ error: 'Failed to create task' });
        }
    }

    // Get all tasks associated with the user
    async getUserTasks(req, res) {
        try {
            const userId = req.user.userId;

            const user = await User.findById(userId).populate('tasks');
            if (!user)
                return res.status(404).json({ message: 'User not found' });

            res.json(user.tasks);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            res.status(500).json({ error: 'Failed to fetch tasks' });
        }
    }

    // Update a specific task by ID
    async updateTask(req, res) {
        try {
            const { taskId } = req.params;
            const updates = req.body;

            const updatedTask = await Task.findByIdAndUpdate(taskId, updates, {
                new: true, // Return the updated task
            });

            if (!updatedTask) {
                return res.status(404).json({ message: 'Task not found' });
            }

            res.json({
                message: 'Task updated successfully',
                task: updatedTask,
            });
        } catch (error) {
            console.error('Error updating task:', error);
            res.status(500).json({ error: 'Failed to update task' });
        }
    }

    // Delete a specific task by ID and remove it from the user's tasks
    async deleteTask(req, res) {
        try {
            const { taskId } = req.params;
            const userId = req.user.userId;

            const task = await Task.findByIdAndDelete(taskId);
            if (!task)
                return res.status(404).json({ message: 'Task not found' });

            // Remove task reference from the user
            await User.findByIdAndUpdate(userId, { $pull: { tasks: taskId } });

            res.json({ message: 'Task deleted successfully' });
        } catch (error) {
            console.error('Error deleting task:', error);
            res.status(500).json({ error: 'Failed to delete task' });
        }
    }

    // Update task status to maintain progress (e.g., pending, in-progress, completed)
    async updateTaskStatus(req, res) {
        try {
            const { taskId } = req.params;
            const { status } = req.body;

            const validStatuses = ['pending', 'in-progress', 'completed'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ message: 'Invalid status' });
            }

            const task = await Task.findByIdAndUpdate(
                taskId,
                { status },
                { new: true }
            );
            if (!task)
                return res.status(404).json({ message: 'Task not found' });

            res.json({ message: 'Task status updated successfully', task });
        } catch (error) {
            console.error('Error updating task status:', error);
            res.status(500).json({ error: 'Failed to update task status' });
        }
    }
}

export const taskController = new TaskController();
