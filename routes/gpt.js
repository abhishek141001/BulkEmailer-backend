// server.js
import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const gpt = express.Router();


// Middleware
gpt.use(bodyParser.json());



const prompt = ` I have an array of tasks that users have completed throughout the day, which may vary in detail and scope. Please analyze this data and generate:A comprehensive work progress report that includes:A summary of the tasks completed, highlighting key actions taken. Notable accomplishments and highlights from the days work.Any challenges faced and how they were addressed.Insights or learnings gained from the days activities.A rief reflection on the overall productivity of the day.A sharable media post description for a 'build in public' group, formatted as either a single post or a carousel. The media will contain text, so provide:A brief caption under 60 words, focusing on a specific insight or accomplishment. Concise text for each media slide that summarizes tasks, key insights, and learnings in a human-like tone, using minimal emojis. Each slide should highlight a detail from the days work.`




// Route to send prompt to GPT-3.5
const getTasksForDate = async (date) => {
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
  
    return await Task.find({
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    });
  };
  
  // Route to get tasks for one day, send to GPT-3.5, and respond with the generated result
  gpt.post('/api/generate-tasks-summary', async (req, res) => {
      const {  date } = req.body;
  
      try {
          // Fetch tasks for the provided date
          const tasks = await getTasksForDate(new Date(date));
  
          if (!tasks || tasks.length === 0) {
              return res.status(404).json({ message: 'No tasks found for the specified date.' });
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
                  { role: "user", content: `Here are the tasks for ${date}:\n\n${tasksSummary}` }
              ],
              max_tokens: 150, // Adjust as needed
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
