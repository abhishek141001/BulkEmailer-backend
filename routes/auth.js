import express from 'express'
import passport from 'passport';
import User from '../modal/User.js';
import { verifyToken } from '../middleware/verifyToken.js';
import bcrypt from 'bcrypt'
import crypto from 'crypto';



const router = express.Router();

// const algorithm = 'aes-256-cbc';
// const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');


// function encrypt(text) {
//     const iv = crypto.randomBytes(16); // Initialization vector
//     let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
//     let encrypted = cipher.update(text, 'utf8', 'hex');
//     encrypted += cipher.final('hex');
//     return JSON.stringify({ iv: iv.toString('hex'), encryptedData: encrypted });
// }


router.get('/status', verifyToken, (req, res) => {
    if (req.user) {
      // User is authenticated if `req.user` exists after token verification
      res.status(200).json({ isAuthenticated: true, user: req.user });
    } else {
      res.status(200).json({ isAuthenticated: false });
    }
  });
  

  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  router.get('/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
    const { user } = req.user; // Destructure user and token from req.user
    res.cookie('token', token, 'user',user,{
      httpOnly: true, // Prevents client-side access to the cookie
      secure: true, // Required for 'SameSite=None' to work
      sameSite: 'None', // Allow the cookie to be sent in cross-origin requests
    });
    
  
    // Redirect to frontend
    res.redirect('http://localhost:3000');
  });
  

router.get('/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error('Logout error', err);
        return res.status(500).send('Logout failed');
      }
      res.redirect('https://symphonious-vacherin-831651.netlify.app/'); // Redirect after successful logout
    });
  });



  router.post('/save-email', verifyToken, async (req, res) => {
    const userId = req.user.id; // Assuming `req.user` contains the decoded JWT with user id
    console.log('Request body:', req.body);

    const { email, emailPassword, provider } = req.body;
  
    try {
    //   const hashedEmailPassword = await bcrypt.hash(emailPassword, 10);
    //   const encryptedPassword = encrypt(emailPassword);
      await User.findByIdAndUpdate(userId, { emailBulk: email, emailPassword: emailPassword,provider:provider});
      
      res.status(200).json({ message: 'Email and password saved successfully' });
    } catch (error) {
        console.log(error)
      res.status(500).json({ message: 'Error saving email and password', error });
    }
  });
  
  
export default router;
