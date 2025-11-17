import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema({
  spotId: {
    type: Number,
    required: true
  },
  hostAddress: {
    type: String,
    required: true,
    lowercase: true
  },
  location: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  price: {
    type: String,
    required: true
  },
  priceInWei: {
    type: String,
    required: true
  },
  isBooked: {
    type: Boolean,
    default: false
  },
  driverAddress: {
    type: String,
    default: null,
    lowercase: true
  },
  bookingEndTime: {
    type: Number,
    default: 0
  },
  images: [{
    type: String
  }],
  amenities: [{
    type: String
  }],
  availability: {
    startTime: String,
    endTime: String
  },
  rating: {
    type: Number,
    default: 0
  },
  reviews: [{
    user: String,
    rating: Number,
    comment: String,
    createdAt: Date
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Listing', listingSchema);
