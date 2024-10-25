// routes/taskRoutes.js
import { Router } from 'express';
import { taskController } from '../controllers/taskController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post(
    '/',
    authMiddleware,
    taskController.createTask.bind(taskController)
);
router.get(
    '/',
    authMiddleware,
    taskController.getUserTasks.bind(taskController)
);
router.put(
    '/:taskId',
    authMiddleware,
    taskController.updateTask.bind(taskController)
);
router.delete(
    '/:taskId',
    authMiddleware,
    taskController.deleteTask.bind(taskController)
);
router.patch(
    '/:taskId/status',
    authMiddleware,
    taskController.updateTaskStatus.bind(taskController)
);

export const taskRoutes = router;
