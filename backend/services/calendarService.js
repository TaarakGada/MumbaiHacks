import { google } from 'googleapis';
import { oauth2Client } from '../config/google.js';

class CalendarService {
    async getEvents(accessToken, timeMin, timeMax) {
        oauth2Client.setCredentials({ access_token: accessToken });
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: timeMin || new Date().toISOString(),
            timeMax:
                timeMax ||
                new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
        });

        return response.data.items;
    }

    async createEvent(accessToken, eventDetails) {
        oauth2Client.setCredentials({ access_token: accessToken });
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const response = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: eventDetails,
        });

        return response.data;
    }
}

export const calendarService = new CalendarService();
