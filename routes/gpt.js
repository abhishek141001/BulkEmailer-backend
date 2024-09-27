import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import dotenv from 'dotenv';
import Task from '../modal/Task.js'; // Ensure the path is correct based on your file structure

dotenv.config();

const gemini = express.Router();

// Middleware
gemini.use(bodyParser.json());

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

// Route to get tasks for one day, send to Gemini API, and respond with the generated result
gemini.post('/api/generate-tasks-summary', async (req, res) => {
    const today = new Date(); // Get today's date

    try {
        // Fetch tasks for the provided date
        const tasks = await getTasksForDate(today);

        if (!tasks || tasks.length === 0) {
            return res.status(404).json({ message: 'No tasks found for today.' });
        }

        // Create a formatted string from tasks to send to the Gemini API
        const tasksSummary = tasks.map(task => 
            `Task: ${task.task}\nDescription: ${task.description}\nProblem: ${task.problem}\n\n`
        ).join('');

        // Send the prompt and tasks to Gemini API
        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GOOGLE_API_KEY}`, {
            contents: [
                {
                    parts: [
                        { text: `${prompt}\nHere are the tasks for today:\n\n${tasksSummary}` }
                    ]
                }
            ]
        }, {
            headers: {
                'Content-Type': 'application/json',
            }
        });

        // Send the Gemini response to the client
        console.log(response.data)
        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong!' });
    }
});

export default gemini;
