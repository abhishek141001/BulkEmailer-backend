import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
    task: String,
    description: String,
    problem: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Task = mongoose.model('Task', taskSchema);
export default Task;
