import express from 'express';
import passport from 'passport';
import session from 'express-session'; // Use express-session instead
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import passportSetup from './config/passport.js';
import authRoutes from './routes/auth.js';
import bulkMail from './routes/bulkMail.js';
import cors from 'cors'
dotenv.config();

const app = express();
const allowedOrigins = ['http://localhost:3000'];
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

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
