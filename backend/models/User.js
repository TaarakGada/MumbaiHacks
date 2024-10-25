// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        picture: String,
        googleId: {
            type: String,
            required: true,
            unique: true,
        },
        accessToken: {
            type: String,
            required: true,
        },
        refreshToken: String,
        tokenExpiry: Date,
        lastLogin: {
            type: Date,
            default: Date.now,
        },
        emails: [
            {
                messageId: String,
                subject: String,
                snippet: String,
                timestamp: Date,
            },
        ],
        calendar: [
            {
                eventId: String,
                summary: String,
                start: Date,
                end: Date,
            },
        ],
        tasks: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Task', // Reference to the Task model
            },
        ],
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Add indexes for better query performance
userSchema.index({ googleId: 1 });
userSchema.index({ email: 1 });

export const User = mongoose.model('User', userSchema);
