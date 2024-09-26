import express from 'express';
import passport from 'passport';
import session from 'express-session'; // Use express-session instead
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import passportSetup from './config/passport.js';
import authRoutes from './routes/auth.js';
import bulkMail from './routes/bulkMail.js';
import cors from 'cors'
import multer from 'multer';
import Task from './modal/Task.js';

dotenv.config();

const app = express();
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Directory where files will be stored
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Custom filename
  },
});

const upload = multer({ dest: 'uploads/' });
const allowedOrigins = ['http://localhost:3000','https://symphonious-vacherin-831651.netlify.app'];
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: allowedOrigins,  // Use specific origin instead of '*'
  credentials: true,       // Enable credentials (cookies, sessions, etc.)
}));
connectDB();
passportSetup(passport);
// app.use(cors)
// Use express-session instead of cookie-session
app.use(
  session({
    secret: process.env.SESSION_KEY, // Use your session key from .env
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Use `secure: true` in production when using HTTPS
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);
app.use(bulkMail);
app.post('/api/tasks', upload.single('media'), async (req, res) => {
  const { task, description, problem } = req.body;
  const media = req.file;

  try {
    // Create a new task entry in the database
    const newTask = new Task({
      task,
      description,
      problem,
      media: {
        filename: media.filename,
        path: media.path,
        mimetype: media.mimetype,
        size: media.size,
      },
    });

    // Save the task in the database
    await newTask.save();

    res.status(201).send('Task saved successfully!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error saving task!');
  }
});
app.get('/',(req,res)=>{
    res.send('<h2>hello</h2>')
})

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
