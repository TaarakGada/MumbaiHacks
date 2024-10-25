// models/Task.js
import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        content: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: ['pending', 'in-progress', 'completed'],
            default: 'pending',
        },
        dueDate: {
            type: Date,
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium',
        },
        tags: {
            type: [String], // Array of strings to store multiple tags
            default: [],
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt timestamps
    }
);

// Indexing for faster querying by status and priority
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });

export const Task = mongoose.model('Task', taskSchema);
