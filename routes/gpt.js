import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import dotenv from 'dotenv';
import Task from '../models/Task.js'; // Ensure the path is correct based on your file structure

dotenv.config();

const gpt = express.Router();

// Middleware
gpt.use(bodyParser.json());

const prompt = `I have an array of tasks that users have completed throughout the day, which may vary in detail and scope. Please analyze this data and generate:
1. A comprehensive work progress report that includes:
   - A summary of the tasks completed, highlighting key actions taken.
   - Notable accomplishments and highlights from the day's work.
   - Any challenges faced and how they were addressed.
   - Insights or learnings gained from the day's activities.
   - A brief reflection on the overall productivity of the day.
2. A sharable media post description for a 'build in public' group, formatted as either a single post or a carousel. The media will contain text, so provide:
   - A brief caption under 60 words, focusing on a specific insight or accomplishment.
   - Concise text for each media slide that summarizes tasks, key insights, and learnings in a human-like tone, using minimal emojis. Each slide should highlight a detail from the day's work.`;

// Utility function to get tasks for a specific day
const getTasksForDate = async (today) => {
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    return await Task.find({
        createdAt: {
            $gte: startOfDay,
            $lt: endOfDay
        }
    });
};

// Route to get tasks for one day, send to GPT-3.5, and respond with the generated result
gpt.post('/api/generate-tasks-summary', async (req, res) => {
    const today = new Date(); // Get today's date

    try {
        // Fetch tasks for the provided date
        const tasks = await getTasksForDate(today);

        if (!tasks || tasks.length === 0) {
            return res.status(404).json({ message: 'No tasks found for today.' });
        }

        // Create a formatted string from tasks to send to GPT-3.5
        const tasksSummary = tasks.map(task => 
            `Task: ${task.task}\nDescription: ${task.description}\nProblem: ${task.problem}\n\n`
        ).join('');

        // Send the prompt and tasks to GPT-3.5
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-3.5-turbo",
            messages: [
                { role: "user", content: prompt },
                { role: "user", content: `Here are the tasks for today:\n\n${tasksSummary}` }
            ],
            max_tokens: 300, // Adjust max_tokens based on your needs
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            }
        });

        // Send the GPT-3.5 response to the client
        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong!' });
    }
});

export default gpt;
