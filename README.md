> NOTE: *The final development [commit](https://github.com/piyerx/hackbios/commit/1c65ebd3e6dea2508b0524cfbc4ea6dce9b743e0) was made within the hackathon duration. Any changes made after that are only related to image attachments and readme updations.* 

![OMEGA_HackBios](https://github.com/user-attachments/assets/69ba6c55-4a90-4af3-a9b9-1eb1646cb7bd)

# ETHPark - Decentralized Parking Marketplace
A decentralized, peer-to-peer parking marketplace built on Ethereum. Think "Airbnb for parking spots" but without a central company.
<p align="center">
<img width="500" alt="ethpark_img" src="https://github.com/user-attachments/assets/f8b67df9-4d5d-4133-905b-cce56b7fce28" />
</p>  
<p align="center">
  <a href="https://youtu.be/mJ_tdGQzv6Y?si=rHQx1qZITeyOVTM0"><img src="https://img.shields.io/badge/YouTube-Watch-red?logo=youtube" /></a>
  <a href="https://ethpark-hackbios.vercel.app/"><img src="https://img.shields.io/badge/Live-Deployment-brightgreen?logo=firebase" /></a>
</p>

## ■ Features

- **For Drivers**: Find and book parking spots instantly with secure blockchain payments
- **For Hosts**: List your empty parking spot and earn passive income in ETH
- **Trustless Escrow**: Smart contract holds payments securely until booking ends
- **No Middleman**: Direct peer-to-peer transactions on the blockchain
<img width="900" alt="image" src="https://github.com/user-attachments/assets/e5926e5f-61e7-4236-b52d-777cae55c5fa" />
<img width="600" alt="image" src="https://github.com/user-attachments/assets/87e518c4-954d-416b-8fa9-a40768c2851b" />

## ■ Tech Stack

- **Frontend**: React + Vite
- **Styling**: Tailwind CSS (Blue color theme)
- **Web3**: ethers.js v5
- **Network**: Ethereum Sepolia Testnet

## ■ Prerequisites

- Node.js (v16 or higher)
- MetaMask browser extension
- Sepolia Testnet ETH (get from [Sepolia Faucet](https://sepoliafaucet.com/))

## ■ How It Works

### The Workflow (User Journey)

#### Alice (The Host)
1. Alice connects her MetaMask wallet
2. Goes to "List Your Spot" tab
3. Enters location (e.g., "123 Main St") and price (e.g., "0.01 ETH")
4. Clicks "List My Spot" and confirms transaction
5. Her spot is now live on the blockchain

#### Bob (The Driver)
1. Bob connects his wallet
2. Sees available spots on "Find Parking" tab
3. Finds Alice's spot: "123 Main St - 0.01 ETH"
4. Clicks "Book Now" and confirms payment
5. 0.01 ETH is sent to the smart contract (escrow)
6. The spot shows as "BOOKED"

#### The Payoff
1. Booking period ends (2 minutes in demo)
2. Alice sees "Ready to Claim" status
3. She clicks "Claim Payment"
4. Smart contract transfers 0.01 ETH to Alice's wallet

## ■ Smart Contract Functions

```solidity
// Host lists a new parking spot
function listSpot(string calldata _location, uint256 _price) external

// Driver books a spot (payable)
function bookSpot(uint256 _spotId) external payable

// Host claims payment after booking ends
function claimPayment(uint256 _spotId) external

// Get total number of spots
function nextSpotId() public view returns (uint256)

// Get spot details
function getSpot(uint256 _spotId) public view returns (...)
```

## ■ UI Components

- **Header**: Title, logo, and wallet connection
- **Tabs**: Switch between Driver and Host views
- **DriverView**: Browse and book available parking spots
- **HostView**: List new spots and manage your listings
- **LoadingOverlay**: Shows during transaction processing
- **Notification**: Success/error messages (toast style)

## ■ Hackathon Tracks

- **Traffic Track**: Addressing urban traffic congestion by making parking more efficient
- **ETH-Based Track**: Using Ethereum smart contracts for trustless, decentralized peer-to-peer payments

## ■ Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Smart Contract

Open `src/contract.js` and replace `YOUR_SEPOLIA_CONTRACT_ADDRESS_HERE` with your deployed contract address:

```javascript
export const CONTRACT_ADDRESS = "0xYourContractAddressHere";
```

### 3. Run Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

### 4. Connect MetaMask

1. Make sure MetaMask is installed
2. Switch to Sepolia Testnet in MetaMask
3. Click "Connect Wallet" in the app
4. Approve the connection

## ■ Build Commands

```bash
# Development
npm run dev

# Production Build
npm run build

# Preview Production Build
npm run preview
```

## ■ Security Features

- **Trustless Escrow**: Payments held in smart contract until booking ends
- **No Middleman**: Direct peer-to-peer transactions
- **Transparent**: All transactions on public blockchain
- **Immutable**: Smart contract code cannot be changed

## ■ Responsive Design

The app is fully responsive and works on:
- Desktop browsers
- Tablets
- Mobile devices

## ■ Design System

- **Primary Colors**: Blue shades (no gradients)
- **Background**: Light blue (primary-50)
- **Buttons**: Solid blue (primary-600)
- **Hover States**: Darker blue (primary-700)
- **Text**: Dark blue (primary-700) and medium blue (primary-600)
---
Built for the HackBios 2025 Hackathon
