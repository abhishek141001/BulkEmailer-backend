import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  task: { type: String, required: true },
  description: { type: String, required: true },
  problem: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },  // Automatically captures creation date
});

const Task = mongoose.model('Task', taskSchema);

export default Task;
