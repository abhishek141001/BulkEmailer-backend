// models/Task.js
import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  task: { type: String, required: true },
  description: { type: String },
  problem: { type: String },
  media: {
    filename: String,
    path: String,
    mimetype: String,
    size: Number,
  },
  createdAt: { type: Date, default: Date.now },
});

const Task = mongoose.model('Task', taskSchema);

export default Task;
