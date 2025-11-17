# Deployment Guide

## Prerequisites

1. **Get Sepolia ETH**
   - Visit https://sepoliafaucet.com or https://www.alchemy.com/faucets/ethereum-sepolia
   - Connect your wallet and get free test ETH

2. **Get Alchemy API Key** (Free)
   - Go to https://www.alchemy.com
   - Sign up and create a new app
   - Select "Ethereum" → "Sepolia"
   - Copy the API key from the dashboard

3. **Get Your Private Key**
   - Open MetaMask
   - Click the 3 dots → Account Details → Export Private Key
   - **⚠️ WARNING: Never share this key or commit it to Git!**

4. **Get Etherscan API Key** (Optional, for verification)
   - Go to https://etherscan.io/apis
   - Sign up and create a free API key

## Setup .env File

Edit your `.env` file and add these values:

```env
PRIVATE_KEY=your_private_key_from_metamask
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## Deploy the Contract

Run:
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

This will:
1. Compile the smart contract
2. Deploy to Sepolia testnet
3. Display the contract address
4. Show you the command to verify on Etherscan

## Update Frontend

After deployment, copy the contract address and update `src/contract.js`:
```javascript
export const CONTRACT_ADDRESS = "0xYourDeployedContractAddress";
```

## Verify on Etherscan (Optional)

```bash
npx hardhat verify --network sepolia YOUR_CONTRACT_ADDRESS
```

This makes your contract readable on Etherscan!
