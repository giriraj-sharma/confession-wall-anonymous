const express = require('express');
const session = require('express-session');
const passport = require('passport');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bodyParser = require('body-parser');

dotenv.config();

const ConfessionRoutes = require('./routes/confessions');
require('./auth');
const { isAuthenticated } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'change_this',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/confession-wall', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB error', err));

app.use('/confessions', ConfessionRoutes);

// API: current user
app.get('/api/me', (req, res) => {
  if (req.user) return res.json({ loggedIn: true, user: req.user });
  return res.json({ loggedIn: false });
});

// Auth routes
// legacy route - keep compatibility
app.get('/auth/user', (req, res) => {
  if (req.user) return res.json({ loggedIn: true, user: req.user });
  return res.json({ loggedIn: false });
});

app.get('/auth/logout', (req, res) => {
  req.logout(() => {});
  res.redirect('/');
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // redirect to protected dashboard
    res.redirect('/dashboard');
  }
);

// Protect SPA dashboard routes server-side - serve index.html when authenticated
app.get('/dashboard', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});
app.get('/my-confessions', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// root - serve landing or redirect to dashboard
app.get('/', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) return res.redirect('/dashboard');
  return res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

// About is public - let static serve

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
