const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

// Load environment variables
dotenv.config();

// Initialize the app
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error(err));

// Storage configuration for file upload (Profile Picture)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

// User Schema (MongoDB)
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePicture: String,
  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: true }
  },
  theme: { type: String, enum: ['light', 'dark'], default: 'light' },
});

const User = mongoose.model('User', UserSchema);

// Middleware for checking JWT token
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).send('Access denied');

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send('Invalid token');
    req.user = user;
    next();
  });
};

// Routes

// User registration route
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    res.status(201).send('User created');
  } catch (err) {
    res.status(400).send('Error registering user');
  }
});

// User login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).send('User not found');

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).send('Invalid password');

    const token = jwt.sign({ _id: user._id, email: user.email }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (err) {
    res.status(400).send('Login failed');
  }
});

// Update profile settings
app.put('/settings/profile', authenticateToken, upload.single('profilePicture'), async (req, res) => {
  const { name, email } = req.body;
  const user = await User.findById(req.user._id);

  if (name) user.name = name;
  if (email) user.email = email;
  if (req.file) user.profilePicture = req.file.path;

  try {
    await user.save();
    res.status(200).send('Profile updated');
  } catch (err) {
    res.status(400).send('Error updating profile');
  }
});

// Update notification settings
app.put('/settings/notifications', authenticateToken, async (req, res) => {
  const { emailNotifications, smsNotifications } = req.body;
  const user = await User.findById(req.user._id);

  if (emailNotifications !== undefined) user.notifications.email = emailNotifications;
  if (smsNotifications !== undefined) user.notifications.sms = smsNotifications;

  try {
    await user.save();
    res.status(200).send('Notification settings updated');
  } catch (err) {
    res.status(400).send('Error updating notification settings');
  }
});

// Update theme preferences
app.put('/settings/theme', authenticateToken, async (req, res) => {
  const { theme } = req.body;
  const user = await User.findById(req.user._id);

  if (theme) user.theme = theme;

  try {
    await user.save();
    res.status(200).send('Theme preferences updated');
  } catch (err) {
    res.status(400).send('Error updating theme preferences');
  }
});

// Change password
app.put('/settings/password', authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);

  const validPassword = await bcrypt.compare(oldPassword, user.password);
  if (!validPassword) return res.status(400).send('Invalid old password');

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;

  try {
    await user.save();
    res.status(200).send('Password updated');
  } catch (err) {
    res.status(400).send('Error updating password');
  }
});

// Deactivate account
app.delete('/settings/deactivate', authenticateToken, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.status(200).send('Account deactivated');
  } catch (err) {
    res.status(400).send('Error deactivating account');
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
