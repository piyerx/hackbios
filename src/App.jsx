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
  const [userBalance, setUserBalance] = useState('0');
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

      // Check network FIRST
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(chainId, 16);
      
      console.log('Current network chain ID:', currentChainId);
      console.log('Expected Sepolia chain ID:', SEPOLIA_CHAIN_ID);

      // If not on Sepolia, try to switch
      if (currentChainId !== SEPOLIA_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }], // Sepolia testnet in hex
          });
          setNotification({ 
            type: 'success', 
            message: 'Switched to Sepolia Testnet!' 
          });
        } catch (switchError) {
          // Network not added to MetaMask
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0xaa36a7',
                  chainName: 'Sepolia Testnet',
                  nativeCurrency: {
                    name: 'Sepolia ETH',
                    symbol: 'SepoliaETH',
                    decimals: 18
                  },
                  rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com/'],
                  blockExplorerUrls: ['https://sepolia.etherscan.io']
                }]
              });
            } catch (addError) {
              console.error('Error adding Sepolia network:', addError);
              setNotification({ 
                type: 'error', 
                message: 'Please add Sepolia Testnet to MetaMask manually!' 
              });
              return;
            }
          } else {
            setNotification({ 
              type: 'error', 
              message: 'Please switch to Sepolia Testnet in MetaMask!' 
            });
            return;
          }
        }
      }

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Initialize provider and signer
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const web3Signer = web3Provider.getSigner();
      const address = await web3Signer.getAddress();
      
      // Get Sepolia balance
      const balance = await web3Provider.getBalance(address);
      const balanceInEth = ethers.utils.formatEther(balance);
      console.log('Sepolia ETH Balance:', balanceInEth);
      setUserBalance(balanceInEth);

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
        message: 'Connected to Sepolia!' 
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
                id: `blockchain-${spot.id.toNumber()}`,
                blockchainId: spot.id.toNumber(),
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

      // Always load from database to show all spots
      try {
        const dbListings = await api.getAllListings({ isBooked: false });
        const dbSpots = dbListings.map(listing => ({
          id: `db-${listing.spotId || listing._id}`,
          dbId: listing.spotId || listing._id,
          host: listing.hostAddress,
          location: listing.location,
          price: ethers.BigNumber.from(listing.priceInWei || '1000000000000000'),
          isBooked: listing.isBooked,
          driver: listing.driverAddress,
          bookingEndTime: listing.bookingEndTime || 0,
          description: listing.description,
          amenities: listing.amenities,
          rating: listing.rating,
          reviews: listing.reviews,
          availability: listing.availability
        }));

        // Merge blockchain spots with database spots (avoid duplicates)
        const blockchainSpotIds = available.map(s => s.id);
        const uniqueDbSpots = dbSpots.filter(s => !blockchainSpotIds.includes(s.id));
        available.push(...uniqueDbSpots);

        // Load user's spots from database
        const myDbListings = await api.getListingsByHost(userAddress);
        const myDbSpots = myDbListings.map(listing => ({
          id: `db-${listing.spotId || listing._id}`,
          dbId: listing.spotId || listing._id,
          host: listing.hostAddress,
          location: listing.location,
          price: ethers.BigNumber.from(listing.priceInWei || '1000000000000000'),
          isBooked: listing.isBooked,
          driver: listing.driverAddress,
          bookingEndTime: listing.bookingEndTime || 0,
          description: listing.description,
          amenities: listing.amenities,
          rating: listing.rating,
          reviews: listing.reviews,
          availability: listing.availability
        }));

        // Merge with blockchain spots
        const blockchainMySpotIds = myListedSpots.map(s => s.id);
        const uniqueMyDbSpots = myDbSpots.filter(s => !blockchainMySpotIds.includes(s.id));
        myListedSpots.push(...uniqueMyDbSpots);
      } catch (error) {
        console.error('Error loading from database:', error);
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

      {/* Header - Only show when wallet is connected */}
      {userAddress &&       <Header 
        userAddress={userAddress}
        userBalance={userBalance}
        onConnect={connectWallet}
      />}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {!userAddress ? (
          <div className="min-h-screen flex items-center justify-center -mt-20">
            <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-lg w-full border border-gray-100">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-11 h-11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  ETHPark
                </h1>
                <p className="text-sm text-gray-500 font-medium tracking-wide">
                  DECENTRALIZED PARKING MARKETPLACE
                </p>
              </div>
              
              <div className="space-y-4 mb-8 text-gray-700">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm leading-relaxed">Find parking spots instantly or list your empty driveway for others to use</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm leading-relaxed">Secure payments through blockchain escrow with no middlemen</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm leading-relaxed">Hosts earn ETH while drivers save time and money</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm leading-relaxed">Fast, trustless, and fully decentralized parking solution</p>
                </div>
              </div>
              
              <button 
                onClick={connectWallet}
                className="w-full bg-primary-600 text-white px-8 py-4 rounded-xl font-semibold text-base hover:bg-primary-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Connect Wallet
              </button>
              
              <p className="text-xs text-gray-400 text-center mt-6">
                Built on Ethereum • Sepolia Testnet
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <Tabs activeView={activeView} onViewChange={setActiveView} />

            {/* Conditional Views */}
            {activeView === 'driver' ? (
              <DriverView 
                availableSpots={availableSpots}
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
