import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import User from './models/User.js';
import Listing from './models/Listing.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'ETHPark API is running' });
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by wallet address
app.get('/api/users/:walletAddress', async (req, res) => {
  try {
    const user = await User.findOne({ 
      walletAddress: req.params.walletAddress.toLowerCase() 
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or update user
app.post('/api/users', async (req, res) => {
  try {
    const { walletAddress, username, email, role } = req.body;
    
    let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    
    if (user) {
      // Update existing user
      user.username = username || user.username;
      user.email = email || user.email;
      user.role = role || user.role;
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        walletAddress: walletAddress.toLowerCase(),
        username,
        email,
        role: role || 'both'
      });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all listings
app.get('/api/listings', async (req, res) => {
  try {
    const { isBooked, hostAddress } = req.query;
    
    let query = {};
    if (isBooked !== undefined) {
      query.isBooked = isBooked === 'true';
    }
    if (hostAddress) {
      query.hostAddress = hostAddress.toLowerCase();
    }
    
    const listings = await Listing.find(query).sort({ createdAt: -1 });
    res.json(listings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get listing by ID
app.get('/api/listings/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    res.json(listing);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get listing by spot ID
app.get('/api/listings/spot/:spotId', async (req, res) => {
  try {
    const listing = await Listing.findOne({ spotId: parseInt(req.params.spotId) });
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    res.json(listing);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new listing
app.post('/api/listings', async (req, res) => {
  try {
    const listing = await Listing.create(req.body);
    res.status(201).json(listing);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update listing
app.put('/api/listings/:spotId', async (req, res) => {
  try {
    const listing = await Listing.findOneAndUpdate(
      { spotId: parseInt(req.params.spotId) },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    res.json(listing);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete listing
app.delete('/api/listings/:spotId', async (req, res) => {
  try {
    const listing = await Listing.findOneAndDelete({ 
      spotId: parseInt(req.params.spotId) 
    });
    
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get listings by host
app.get('/api/listings/host/:hostAddress', async (req, res) => {
  try {
    const listings = await Listing.find({ 
      hostAddress: req.params.hostAddress.toLowerCase() 
    }).sort({ createdAt: -1 });
    res.json(listings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add review to listing
app.post('/api/listings/:spotId/reviews', async (req, res) => {
  try {
    const { user, rating, comment } = req.body;
    
    const listing = await Listing.findOne({ spotId: parseInt(req.params.spotId) });
    
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    listing.reviews.push({
      user,
      rating,
      comment,
      createdAt: new Date()
    });
    
    // Update average rating
    const totalRating = listing.reviews.reduce((sum, review) => sum + review.rating, 0);
    listing.rating = totalRating / listing.reviews.length;
    
    await listing.save();
    res.json(listing);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 ETHPark API Server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/health\n`);
});
