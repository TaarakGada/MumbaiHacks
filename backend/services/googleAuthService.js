import { google } from 'googleapis';
import { oauth2Client, SCOPES } from '../config/google.js';
import { User } from '../models/User.js';

class GoogleAuthService {
    getAuthUrl() {
        return oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            prompt: 'consent',
        });
    }

    async getTokens(code) {
        try {
            const { tokens } = await oauth2Client.getToken(code);
            return tokens;
        } catch (error) {
            console.error('Error getting tokens:', error);
            throw new Error('Failed to get Google tokens');
        }
    }

    async getUserInfo(accessToken) {
        try {
            oauth2Client.setCredentials({ access_token: accessToken });
            const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
            const userInfo = await oauth2.userinfo.get();
            return userInfo.data;
        } catch (error) {
            console.error('Error getting user info:', error);
            throw new Error('Failed to get user information from Google');
        }
    }

    async refreshAccessToken(refreshToken) {
        try {
            oauth2Client.setCredentials({ refresh_token: refreshToken });
            const { credentials } = await oauth2Client.refreshAccessToken();
            return credentials;
        } catch (error) {
            console.error('Error refreshing token:', error);
            throw new Error('Failed to refresh access token');
        }
    }
}

export const googleAuthService = new GoogleAuthService();
