import React from 'react';

const Header = ({ userAddress, onConnect }) => {
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
            <div className="bg-primary-700 px-4 py-2 rounded-lg">
              <p className="text-xs text-primary-200">Connected</p>
              <p className="font-mono text-sm">{truncateAddress(userAddress)}</p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
