import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import Header from './components/Header';
import LoadingOverlay from './components/LoadingOverlay';
import Notification from './components/Notification';
import Tabs from './components/Tabs';
import DriverView from './components/DriverView';
import HostView from './components/HostView';
import { CONTRACT_ADDRESS, CONTRACT_ABI, SEPOLIA_CHAIN_ID, SEPOLIA_CHAIN_NAME } from './contract';
import api from './api';

function App() {
  // State management
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [userAddress, setUserAddress] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [availableSpots, setAvailableSpots] = useState([]);
  const [mySpots, setMySpots] = useState([]);
  const [activeView, setActiveView] = useState('driver');
  const [loadingMessage, setLoadingMessage] = useState(null);
  const [notification, setNotification] = useState(null);

  // Connect wallet function
  const connectWallet = async () => {
    try {
      if (typeof window.ethereum === 'undefined') {
        setNotification({ 
          type: 'error', 
          message: 'Please install MetaMask to use ETHPark!' 
        });
        return;
      }

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Initialize provider and signer
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const web3Signer = web3Provider.getSigner();
      const address = await web3Signer.getAddress();

      // Check network
      const network = await web3Provider.getNetwork();
      if (network.chainId !== SEPOLIA_CHAIN_ID) {
        setNotification({ 
          type: 'warning', 
          message: `Please switch to ${SEPOLIA_CHAIN_NAME} for blockchain features!` 
        });
        // Continue anyway for demo mode with database
      }

      // Initialize contract only if address is deployed
      let contractInstance = null;
      if (CONTRACT_ADDRESS && CONTRACT_ADDRESS !== "YOUR_SEPOLIA_CONTRACT_ADDRESS_HERE") {
        try {
          contractInstance = new ethers.Contract(
            CONTRACT_ADDRESS, 
            CONTRACT_ABI, 
            web3Signer
          );
        } catch (error) {
          console.log('Contract not deployed yet, using database mode');
        }
      }

      // Update state
      setProvider(web3Provider);
      setSigner(web3Signer);
      setContract(contractInstance);
      setUserAddress(address);

      // Check if user exists in database
      try {
        const user = await api.getUserByWallet(address);
        setCurrentUser(user);
        if (!user) {
          console.log('New user detected - not in database yet');
        }
      } catch (error) {
        console.error('Error checking user:', error);
      }

      setNotification({ 
        type: 'success', 
        message: 'Wallet connected successfully!' 
      });
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setNotification({ 
        type: 'error', 
        message: 'Failed to connect wallet. Please try again.' 
      });
    }
  };

  // Load all spots function
  const loadAllSpots = useCallback(async (currentContract) => {
    if (!userAddress) return;

    try {
      let available = [];
      let myListedSpots = [];

      // If contract exists, try to load from blockchain first
      if (currentContract) {
        try {
          const nextSpotId = await currentContract.nextSpotId();
          const totalSpots = nextSpotId.toNumber();

          for (let i = 0; i < totalSpots; i++) {
            try {
              const spot = await currentContract.getSpot(i);
              
              // Try to get additional info from database
              let dbListing = null;
              try {
                dbListing = await api.getListingBySpotId(i);
              } catch (error) {
                console.log(`No DB listing for spot ${i}`);
              }

              const spotData = {
                id: spot.id.toNumber(),
                host: spot.host,
                location: spot.location,
                price: spot.price,
                isBooked: spot.isBooked,
                driver: spot.driver,
                bookingEndTime: spot.bookingEndTime.toNumber(),
                // Add database fields if available
                ...(dbListing && {
                  description: dbListing.description,
                  amenities: dbListing.amenities,
                  rating: dbListing.rating,
                  reviews: dbListing.reviews,
                  availability: dbListing.availability
                })
              };

              // Categorize spots
              if (spotData.host.toLowerCase() === userAddress.toLowerCase()) {
                myListedSpots.push(spotData);
              }

              if (!spotData.isBooked) {
                available.push(spotData);
              }
            } catch (error) {
              console.error(`Error fetching spot ${i}:`, error);
            }
          }
        } catch (error) {
          console.log('Contract not available, using database only');
        }
      }

      // If no spots from blockchain or no contract, load from database
      if (available.length === 0 && myListedSpots.length === 0) {
        try {
          const dbListings = await api.getAllListings({ isBooked: false });
          available.push(...dbListings.map(listing => ({
            id: listing.spotId,
            host: listing.hostAddress,
            location: listing.location,
            price: ethers.BigNumber.from(listing.priceInWei),
            isBooked: listing.isBooked,
            driver: listing.driverAddress,
            bookingEndTime: listing.bookingEndTime,
            description: listing.description,
            amenities: listing.amenities,
            rating: listing.rating,
            reviews: listing.reviews,
            availability: listing.availability
          })));

          const myDbListings = await api.getListingsByHost(userAddress);
          myListedSpots.push(...myDbListings.map(listing => ({
            id: listing.spotId,
            host: listing.hostAddress,
            location: listing.location,
            price: ethers.BigNumber.from(listing.priceInWei),
            isBooked: listing.isBooked,
            driver: listing.driverAddress,
            bookingEndTime: listing.bookingEndTime,
            description: listing.description,
            amenities: listing.amenities,
            rating: listing.rating,
            reviews: listing.reviews,
            availability: listing.availability
          })));
        } catch (error) {
          console.error('Error loading from database:', error);
        }
      }

      setAvailableSpots(available);
      setMySpots(myListedSpots);
    } catch (error) {
      console.error('Error loading spots:', error);
    }
  }, [userAddress]);

  // Effect to load spots when contract changes
  useEffect(() => {
    if (contract) {
      loadAllSpots(contract);
    }
  }, [contract, loadAllSpots]);

  // Effect to listen for account and chain changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          window.location.reload();
        } else {
          window.location.reload();
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  // Refresh function to pass to child components
  const handleRefresh = useCallback(() => {
    return loadAllSpots(contract);
  }, [contract, loadAllSpots]);

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Loading Overlay */}
      <LoadingOverlay message={loadingMessage} />

      {/* Notification */}
      <Notification 
        notification={notification} 
        onClear={() => setNotification(null)} 
      />

      {/* Header */}
      <Header userAddress={userAddress} onConnect={connectWallet} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {!userAddress ? (
          <div className="card text-center max-w-2xl mx-auto">
            <div className="py-16">
              <div className="w-24 h-24 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-8">
                <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-primary-700 mb-6">
                Welcome to ETHPark
              </h1>
              <div className="text-lg text-gray-700 mb-8 leading-relaxed space-y-2">
                <p>🚗 Find parking spots instantly or rent out your empty driveway</p>
                <p>🔒 Secure payments through blockchain escrow - no middlemen</p>
                <p>💰 Hosts earn ETH, drivers save time and money</p>
                <p>⚡ Fast, trustless, and decentralized parking marketplace</p>
              </div>
              <button 
                onClick={connectWallet}
                className="bg-primary-600 text-white px-10 py-4 rounded-lg font-bold text-lg hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Connect Wallet to Get Started
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <Tabs activeView={activeView} onViewChange={setActiveView} />

            {/* Conditional Views */}
            {activeView === 'driver' ? (
              <DriverView 
                spots={availableSpots}
                contract={contract}
                setLoading={setLoadingMessage}
                setNotification={setNotification}
                onRefresh={handleRefresh}
              />
            ) : (
              <HostView 
                mySpots={mySpots}
                contract={contract}
                setLoading={setLoadingMessage}
                setNotification={setNotification}
                onRefresh={handleRefresh}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-primary-200 mt-12">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-sm text-gray-600">
            Built with ❤️ on Ethereum • Trustless • Decentralized • Secure
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
