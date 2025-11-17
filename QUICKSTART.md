# ETHPark - Quick Start with MongoDB

This guide will help you set up the complete ETHPark application with MongoDB Atlas backend.

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Node.js installed
- MongoDB Atlas account (free tier)

### Step 1: MongoDB Atlas Setup (2 minutes)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up/login
2. Create a FREE cluster (M0 Sandbox)
3. Create database user:
   - Username: `ethpark`
   - Password: `ethpark123`
4. Network Access: Click "Allow Access from Anywhere" (0.0.0.0/0)
5. Get connection string from "Connect" → "Connect your application"

### Step 2: Configure Environment (30 seconds)

1. Open `.env` file in the project root
2. Replace the `MONGODB_URI` with your connection string:

```env
MONGODB_URI=mongodb+srv://ethpark:ethpark123@cluster0.xxxxx.mongodb.net/ethpark?retryWrites=true&w=majority
```

**Important**: Replace `xxxxx` with your actual cluster URL and ensure `ethpark` database name is after `.net/`

### Step 3: Seed Database (30 seconds)

```bash
npm run seed
```

Expected output:
```
✅ MongoDB Connected
✅ Created 5 users
✅ Created 6 listings
📊 Database seeded successfully!
```

### Step 4: Start the Application (1 minute)

**Terminal 1 - Backend:**
```bash
npm run server
```

Wait for:
```
🚀 ETHPark API Server running on port 5000
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Wait for:
```
➜  Local:   http://localhost:3000/
```

### Step 5: Test the App! 🎉

1. Open `http://localhost:3000` in your browser
2. Click "Connect Wallet" (MetaMask required)
3. You'll see example parking spots from the database!

## 📊 Example Users in Database

Use these wallet addresses to test:

| User | Wallet Address | Has Listings |
|------|---------------|--------------|
| Alice Johnson | `0x742d35cc6634c0532925a3b844bc9e7595f0beb0` | Yes (2 spots) |
| Bob Smith | `0x5B38Da6a701c568545dCfcB03FcB875f56beddC4` | Yes (1 spot) |
| Carol Williams | `0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2` | Yes (2 spots) |
| David Brown | `0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db` | No |
| Eve Davis | `0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB` | Yes (1 spot) |

## 🧪 Testing the "Login" Flow

The app automatically recognizes users when they connect their wallet:

1. **Connect with Alice's wallet** (`0x742d35...beb0`)
   - Go to "List Your Spot" tab
   - You'll see her 2 existing listings from the database

2. **Connect with David's wallet** (`0x4B2099...02db`)
   - He has no listings yet
   - But he can see all available spots to book

3. **Connect with a new wallet**
   - Any wallet not in the database
   - The app will still work, just no previous listings

## 🔌 API Endpoints (Backend)

The backend is running on `http://localhost:5000`

Test it:
```bash
# Get all users
curl http://localhost:5000/api/users

# Get specific user
curl http://localhost:5000/api/users/0x742d35cc6634c0532925a3b844bc9e7595f0beb0

# Get all listings
curl http://localhost:5000/api/listings

# Get available listings only
curl http://localhost:5000/api/listings?isBooked=false
```

## 📁 Project Structure

```
traffic/
├── server/              # Backend (Express + MongoDB)
│   ├── models/         # User & Listing schemas
│   ├── config/         # Database connection
│   ├── index.js        # Express server
│   └── seed.js         # Database seeding script
├── src/                # Frontend (React + Vite)
│   ├── components/     # UI components
│   ├── App.jsx         # Main app with DB integration
│   ├── api.js          # API service for backend calls
│   └── contract.js     # Smart contract config
└── .env                # Environment variables
```

## 🔄 How It Works Together

1. **Frontend** (React) runs on port 3000
2. **Backend** (Express) runs on port 5000
3. **Database** (MongoDB Atlas) stores users & listings
4. **Blockchain** (Sepolia) handles actual transactions

When a user connects their wallet:
- Frontend checks if wallet exists in MongoDB
- If yes → Load their profile and listings
- If no → They're a new user (can still use the app)

The app combines data from:
- **MongoDB**: User profiles, descriptions, photos, reviews
- **Blockchain**: Current booking status, payments, timestamps

## ✅ Verification Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Connection string updated in `.env`
- [ ] `npm run seed` completed successfully
- [ ] Backend server running (port 5000)
- [ ] Frontend server running (port 3000)
- [ ] Can see parking spots when opening app
- [ ] MetaMask installed and connected

## 🐛 Troubleshooting

**"Cannot connect to MongoDB"**
- Check your `.env` file
- Verify connection string is correct
- Make sure IP whitelist includes 0.0.0.0/0

**"No listings showing"**
- Make sure you ran `npm run seed`
- Check backend is running on port 5000
- Open browser console to see errors

**"API not responding"**
- Restart the backend server: `npm run server`
- Check if port 5000 is available

## 📚 Next Steps

1. ✅ Basic setup working? Great!
2. Deploy your smart contract to Sepolia
3. Update `CONTRACT_ADDRESS` in `src/contract.js`
4. Test booking and claiming with real blockchain transactions

## 🎉 You're All Set!

Your app now has:
- ✅ User authentication via wallet
- ✅ Database with example users
- ✅ 6 sample parking listings
- ✅ Backend API server
- ✅ Frontend connected to both DB and blockchain

Time to demo! 🚀
