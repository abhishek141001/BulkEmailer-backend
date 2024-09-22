import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../modal/User.js'
import jwt from 'jsonwebtoken';


export default function(passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: 'https://bulkbuddy.site/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        const newUser = {
          googleId: profile.id,
          displayName: profile.displayName,
          email: profile.emails[0].value,
        };
        try {
            let user = await User.findOne({ googleId: profile.id });
            if (user) {
              // User exists, generate a token
              const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
                expiresIn: '1h',
              });
              done(null, { user, token });
            } else {
              // Create a new user
              user = await User.create(newUser);
              const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
                expiresIn: '1h',
              });
              done(null, { user, token });
            }
          } catch (err) {
            console.error(err);
            done(err, null); // Call done with error in case of failure
          }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
  
}
