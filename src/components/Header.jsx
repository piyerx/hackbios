import React, { useState, useEffect } from 'react';

const Header = ({ userAddress, onConnect }) => {
  const [networkName, setNetworkName] = useState('');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true);

  useEffect(() => {
    const checkNetwork = async () => {
      if (window.ethereum && userAddress) {
        try {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          const chainIdDecimal = parseInt(chainId, 16);
          
          if (chainIdDecimal === 11155111) {
            setNetworkName('Sepolia Testnet');
            setIsCorrectNetwork(true);
          } else if (chainIdDecimal === 1) {
            setNetworkName('Ethereum Mainnet');
            setIsCorrectNetwork(false);
          } else {
            setNetworkName(`Chain ID: ${chainIdDecimal}`);
            setIsCorrectNetwork(false);
          }
        } catch (error) {
          console.error('Error checking network:', error);
        }
      }
    };
    
    checkNetwork();
    
    if (window.ethereum) {
      window.ethereum.on('chainChanged', checkNetwork);
      return () => {
        window.ethereum.removeListener('chainChanged', checkNetwork);
      };
    }
  }, [userAddress]);

  const truncateAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <header className="bg-primary-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white text-primary-600 rounded-lg flex items-center justify-center font-bold text-xl">
              P
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">ETHPark</h1>
              <p className="text-xs text-primary-100">Decentralized Parking Marketplace</p>
            </div>
          </div>
          {!userAddress ? (
            <button 
              onClick={onConnect}
              className="bg-white text-primary-600 px-6 py-2 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
            >
              Connect Wallet
            </button>
          ) : (
            <div className="flex items-center gap-3">
              {networkName && (
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  isCorrectNetwork 
                    ? 'bg-green-500 text-white' 
                    : 'bg-red-500 text-white animate-pulse'
                }`}>
                  {networkName}
                </div>
              )}
              <div className="bg-primary-700 px-4 py-2 rounded-lg">
                <p className="text-xs text-primary-200">Connected</p>
                <p className="font-mono text-sm">{truncateAddress(userAddress)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
