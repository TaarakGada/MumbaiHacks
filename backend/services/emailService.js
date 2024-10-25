import { google } from 'googleapis';
import { oauth2Client } from '../config/google.js';

class EmailService {
    constructor() {
        this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        this.keywords = ['meeting', 'follow-up', 'task', 'deadline']; // Filter keywords
    }

    setAccessToken(accessToken) {
        oauth2Client.setCredentials({ access_token: accessToken });
    }

    // Fetch emails with subject, from, body (cleaned), and snippet
    async getEmailsWithDetails(accessToken, maxResults = 20) {
        try {
            this.setAccessToken(accessToken);

            const { data } = await this.gmail.users.messages.list({
                userId: 'me',
                maxResults,
            });

            if (!data.messages) return []; // No emails found

            const emails = await Promise.all(
                data.messages.map(async (message) => {
                    const { data: email } = await this.gmail.users.messages.get(
                        {
                            userId: 'me',
                            id: message.id,
                        }
                    );

                    const { subject, from } = this.extractHeaders(
                        email.payload.headers
                    );
                    const body = this.extractCleanBody(email.payload);
                    const snippet = email.snippet || '';

                    return { id: message.id, subject, from, body, snippet };
                })
            );

            return this.filterRelevantEmails(emails);
        } catch (error) {
            console.error('Error fetching emails:', error.message);
            throw new Error('Unable to fetch emails.');
        }
    }

    extractHeaders(headers) {
        return headers.reduce(
            (acc, header) => {
                if (header.name === 'Subject') acc.subject = header.value;
                if (header.name === 'From') acc.from = header.value;
                return acc;
            },
            { subject: '', from: '' }
        );
    }

    filterRelevantEmails(emails) {
        return emails.filter(({ subject }) =>
            this.keywords.some((keyword) =>
                subject.toLowerCase().includes(keyword)
            )
        );
    }

    extractCleanBody(payload) {
        let rawBody = '';

        const getTextFromParts = (parts) => {
            for (const part of parts) {
                if (part.mimeType === 'text/plain') {
                    rawBody += Buffer.from(part.body.data, 'base64').toString();
                } else if (part.parts?.length) {
                    getTextFromParts(part.parts);
                }
            }
        };

        // Extract text content from email parts
        if (payload.parts?.length) {
            getTextFromParts(payload.parts);
        } else if (payload.body?.data) {
            rawBody = Buffer.from(payload.body.data, 'base64').toString();
        }

        // Clean up the body by removing quoted or forwarded content
        return this.cleanBodyText(rawBody);
    }

    cleanBodyText(body) {
        // Remove forwarded or quoted sections
        const cleanedBody = body
            .split(/---------- Forwarded message ----------|On .*? wrote:/)[0]
            .trim();

        // Remove any leftover subject or sender info from the body
        return cleanedBody
            .replace(/Subject:.*|From:.*|To:.*|Date:.*/gi, '')
            .trim();
    }

    async getEmailDetails(accessToken, emailId) {
        try {
            this.setAccessToken(accessToken);

            const { data } = await this.gmail.users.messages.get({
                userId: 'me',
                id: emailId,
            });

            const { subject, from } = this.extractHeaders(data.payload.headers);
            const body = this.extractCleanBody(data.payload);

            return { id: emailId, subject, from, body };
        } catch (error) {
            console.error('Error fetching email details:', error.message);
            throw new Error('Unable to fetch email details.');
        }
    }
}

export const emailService = new EmailService();
