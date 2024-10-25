import { emailService } from '../services/emailService.js';
import { User } from '../models/User.js';

class EmailController {
    // Get emails with detailed content (subject, from, body)
    async getEmails(req, res) {
        try {
            const user = await User.findById(req.user.userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const emails = await emailService.getEmailsWithDetails(
                user.accessToken,
                req.query.maxResults || 20
            );

            res.json(emails);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Get details of a specific email
    async getEmailById(req, res) {
        try {
            const user = await User.findById(req.user.userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const email = await emailService.getEmailDetails(
                user.accessToken,
                req.params.id
            );

            res.json(email);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const emailController = new EmailController();
