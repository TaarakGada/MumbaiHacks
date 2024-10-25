import { emailService } from '../services/emailService.js';
import { User } from '../models/User.js';

class EmailController {
    async getEmails(req, res) {
        try {
            const user = await User.findById(req.user.userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const emails = await emailService.getEmailsWithDetails(
                user.accessToken
            );
            res.json(emails);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const emailController = new EmailController();
