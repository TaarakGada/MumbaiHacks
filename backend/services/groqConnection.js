// groqService.js
import 'dotenv/config';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function getGroqChatCompletion(prompt) {
    try {
        const response = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama3-8b-8192',
        });

        return response.choices[0]?.message?.content || 'No response received';
    } catch (error) {
        console.error('Error fetching Groq response:', error);
        throw new Error('Failed to fetch Groq chat completion');
    }
}
