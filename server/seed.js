import 'dotenv/config';
import mongoose from 'mongoose';
import { ethers } from 'ethers';
import User from './models/User.js';
import Listing from './models/Listing.js';

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Example wallet addresses (you can replace with real ones)
const exampleUsers = [
  {
    walletAddress: '0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
    username: 'Alice Johnson',
    email: 'alice@example.com',
    role: 'host'
  },
  {
    walletAddress: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
    username: 'Bob Smith',
    email: 'bob@example.com',
    role: 'both'
  },
  {
    walletAddress: '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2',
    username: 'Carol Williams',
    email: 'carol@example.com',
    role: 'host'
  },
  {
    walletAddress: '0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db',
    username: 'David Brown',
    email: 'david@example.com',
    role: 'driver'
  },
  {
    walletAddress: '0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB',
    username: 'Eve Davis',
    email: 'eve@example.com',
    role: 'both'
  }
];

// Example listings
const exampleListings = [
  {
    spotId: 0,
    hostAddress: '0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
    location: '123 Main Street, Downtown',
    description: 'Secure covered parking space in downtown area. Close to shopping mall and restaurants.',
    price: '0.001',
    priceInWei: ethers.utils.parseEther('0.001').toString(),
    isBooked: false,
    amenities: ['Covered', 'Security Camera', '24/7 Access'],
    availability: { startTime: '06:00', endTime: '22:00' },
    rating: 4.8,
    reviews: [
      {
        user: 'Bob Smith',
        rating: 5,
        comment: 'Great location, easy access!',
        createdAt: new Date('2025-11-10')
      }
    ]
  },
  {
    spotId: 1,
    hostAddress: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
    location: '456 Oak Avenue, Midtown',
    description: 'Private driveway parking. Quiet neighborhood, perfect for daily parking.',
    price: '0.0008',
    priceInWei: ethers.utils.parseEther('0.0008').toString(),
    isBooked: false,
    amenities: ['Private', 'Well-lit', 'Gated'],
    availability: { startTime: '00:00', endTime: '23:59' },
    rating: 4.5,
    reviews: []
  },
  {
    spotId: 2,
    hostAddress: '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2',
    location: '789 Elm Street, Business District',
    description: 'Garage parking in business district. Ideal for office workers.',
    price: '0.0015',
    priceInWei: ethers.utils.parseEther('0.0015').toString(),
    isBooked: true,
    driverAddress: '0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db',
    bookingEndTime: Math.floor(Date.now() / 1000) + 7200, // 2 hours from now
    amenities: ['Garage', 'Electric Charging', 'Covered'],
    availability: { startTime: '07:00', endTime: '19:00' },
    rating: 4.9,
    reviews: [
      {
        user: 'David Brown',
        rating: 5,
        comment: 'Perfect for work days!',
        createdAt: new Date('2025-11-15')
      }
    ]
  },
  {
    spotId: 3,
    hostAddress: '0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
    location: '321 Pine Road, Residential Area',
    description: 'Street parking available in front of house. Safe neighborhood.',
    price: '0.0005',
    priceInWei: ethers.utils.parseEther('0.0005').toString(),
    isBooked: false,
    amenities: ['Street Parking', 'Residential'],
    availability: { startTime: '00:00', endTime: '23:59' },
    rating: 4.3,
    reviews: []
  },
  {
    spotId: 4,
    hostAddress: '0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB',
    location: '555 Maple Drive, University Campus',
    description: 'Parking near university campus. Great for students and visitors.',
    price: '0.0006',
    priceInWei: ethers.utils.parseEther('0.0006').toString(),
    isBooked: false,
    amenities: ['Campus Access', 'Student Friendly'],
    availability: { startTime: '08:00', endTime: '20:00' },
    rating: 4.6,
    reviews: []
  },
  {
    spotId: 5,
    hostAddress: '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2',
    location: '888 Broadway, Theater District',
    description: 'Premium parking spot near theaters and entertainment venues.',
    price: '0.002',
    priceInWei: ethers.utils.parseEther('0.002').toString(),
    isBooked: false,
    amenities: ['Premium', 'Valet Available', 'Covered'],
    availability: { startTime: '12:00', endTime: '02:00' },
    rating: 4.7,
    reviews: []
  }
];

const seedDatabase = async () => {
  try {
    await connectDB();
    
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Listing.deleteMany({});
    
    console.log('👥 Creating users...');
    const users = await User.insertMany(exampleUsers);
    console.log(`✅ Created ${users.length} users`);
    
    console.log('🏠 Creating listings...');
    const listings = await Listing.insertMany(exampleListings);
    console.log(`✅ Created ${listings.length} listings`);
    
    console.log('\n📊 Database seeded successfully!');
    console.log('\n👥 Example Users:');
    users.forEach(user => {
      console.log(`   - ${user.username} (${user.walletAddress})`);
    });
    
    console.log('\n🏠 Example Listings:');
    listings.forEach(listing => {
      console.log(`   - ${listing.location} - ${listing.price} ETH`);
    });
    
    console.log('\n✅ All done! You can now start the server.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
