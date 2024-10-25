import jwt from 'jsonwebtoken';
import { googleAuthService } from '../services/googleAuthService.js';
import { User } from '../models/User.js';

class AuthController {
    async getAuthUrl(req, res) {
        try {
            const url = googleAuthService.getAuthUrl();
            res.json({ url });
        } catch (error) {
            console.error('Auth URL Error:', error);
            res.status(500).json({
                error: 'Failed to generate authentication URL',
            });
        }
    }

    async handleCallback(req, res) {
        try {
            const { code } = req.query;
            if (!code) {
                return res
                    .status(400)
                    .json({ error: 'Authorization code is required' });
            }

            // Get tokens from Google
            const tokens = await googleAuthService.getTokens(code);
            if (!tokens.access_token) {
                return res
                    .status(400)
                    .json({ error: 'Failed to get access token' });
            }

            // Get user information from Google
            const googleUser = await googleAuthService.getUserInfo(
                tokens.access_token
            );
            if (!googleUser || !googleUser.id) {
                return res
                    .status(400)
                    .json({ error: 'Failed to get user information' });
            }

            // Find or create user in database
            let user = await User.findOne({ googleId: googleUser.id });
            const updateData = {
                email: googleUser.email,
                name: googleUser.name,
                picture: googleUser.picture,
                accessToken: tokens.access_token,
                tokenExpiry: new Date(tokens.expiry_date),
                lastLogin: new Date(),
            };

            if (tokens.refresh_token) {
                updateData.refreshToken = tokens.refresh_token;
            }

            if (user) {
                // Update existing user
                user = await User.findOneAndUpdate(
                    { googleId: googleUser.id },
                    updateData,
                    { new: true, runValidators: true }
                );
            } else {
                // Create new user
                user = await User.create({
                    ...updateData,
                    googleId: googleUser.id,
                });
            }

            // Generate JWT token
            const jwtToken = jwt.sign(
                {
                    userId: user._id,
                    email: user.email,
                    googleId: user.googleId,
                },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            // Return user data and token
            res.json({
                token: jwtToken,
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    picture: user.picture,
                    lastLogin: user.lastLogin,
                },
            });
        } catch (error) {
            console.error('Callback Error:', error);
            res.status(500).json({
                error: 'Authentication failed',
                details:
                    process.env.NODE_ENV === 'development'
                        ? error.message
                        : undefined,
            });
        }
    }

    async refreshToken(req, res) {
        try {
            const user = await User.findById(req.user.userId);
            if (!user || !user.refreshToken) {
                return res
                    .status(401)
                    .json({ error: 'No refresh token available' });
            }

            const newTokens = await googleAuthService.refreshAccessToken(
                user.refreshToken
            );

            user.accessToken = newTokens.access_token;
            user.tokenExpiry = new Date(newTokens.expiry_date);
            await user.save();

            res.json({
                accessToken: newTokens.access_token,
                expiryDate: newTokens.expiry_date,
            });
        } catch (error) {
            console.error('Token Refresh Error:', error);
            res.status(500).json({ error: 'Failed to refresh token' });
        }
    }

    async getUserProfile(req, res) {
        try {
            const user = await User.findById(req.user.userId).select(
                '-accessToken -refreshToken'
            );

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json(user);
        } catch (error) {
            console.error('Get Profile Error:', error);
            res.status(500).json({ error: 'Failed to get user profile' });
        }
    }

    async logout(req, res) {
        try {
            await User.findByIdAndUpdate(req.user.userId, {
                $unset: { accessToken: 1 },
                lastLogin: new Date(),
            });

            res.json({ message: 'Logged out successfully' });
        } catch (error) {
            console.error('Logout Error:', error);
            res.status(500).json({ error: 'Failed to logout' });
        }
    }
}

export const authController = new AuthController();
