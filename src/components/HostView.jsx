import React, { useState } from 'react';
import { ethers } from 'ethers';

const HostView = ({ mySpots, contract, setLoading, setNotification, onRefresh }) => {
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');

  const handleListSpot = async (e) => {
    e.preventDefault();
    
    if (!location.trim()) {
      setNotification({ type: 'error', message: 'Please enter a location.' });
      return;
    }
    
    if (!price || isNaN(price) || parseFloat(price) <= 0) {
      setNotification({ type: 'error', message: 'Please enter a valid price in ETH.' });
      return;
    }

    try {
      const priceInWei = ethers.utils.parseEther(price);
      
      setLoading('Listing parking spot...');
      const tx = await contract.listSpot(location, priceInWei);
      await tx.wait();
      setLoading(null);
      setNotification({ 
        type: 'success', 
        message: 'Spot listed successfully!' 
      });
      
      setLocation('');
      setPrice('');
      await onRefresh();
    } catch (error) {
      setLoading(null);
      console.error('Error listing spot:', error);
      
      if (error.code === 4001) {
        setNotification({ type: 'error', message: 'Transaction rejected by user.' });
      } else {
        setNotification({ type: 'error', message: 'Failed to list spot. Please try again.' });
      }
    }
  };

  const handleClaimPayment = async (spot) => {
    try {
      setLoading('Claiming payment...');
      const tx = await contract.claimPayment(spot.id);
      await tx.wait();
      setLoading(null);
      setNotification({ 
        type: 'success', 
        message: `Payment claimed! ${ethers.utils.formatEther(spot.price)} ETH sent to your wallet.` 
      });
      await onRefresh();
    } catch (error) {
      setLoading(null);
      console.error('Error claiming payment:', error);
      
      if (error.code === 4001) {
        setNotification({ type: 'error', message: 'Transaction rejected by user.' });
      } else if (error.message?.includes('Booking not ended')) {
        setNotification({ type: 'error', message: 'Booking period has not ended yet.' });
      } else {
        setNotification({ type: 'error', message: 'Failed to claim payment. Please try again.' });
      }
    }
  };

  const getSpotStatus = (spot) => {
    const currentTime = Math.floor(Date.now() / 1000);
    const canClaim = spot.isBooked && currentTime >= spot.bookingEndTime;
    
    if (!spot.isBooked) {
      return { text: 'Available', color: 'text-green-600', bgColor: 'bg-green-100' };
    } else if (canClaim) {
      return { text: 'Ready to Claim', color: 'text-primary-600', bgColor: 'bg-primary-100' };
    } else {
      return { text: 'Booked - In Progress', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    }
  };

  return (
    <div className="space-y-6">
      {/* List New Spot Form */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary-700">List a New Spot</h2>
            <p className="text-sm text-gray-600">Add your parking spot to the marketplace</p>
          </div>
        </div>
        
        <form onSubmit={handleListSpot} className="space-y-4">
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-primary-700 mb-2">
              Location
            </label>
            <input 
              type="text" 
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., 123 Main St, Downtown" 
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-primary-700 mb-2">
              Price (ETH)
            </label>
            <input 
              type="text" 
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g., 0.001" 
              className="input-field"
            />
            <p className="text-xs text-gray-500 mt-1">
              Booking duration: 2 minutes (demo)
            </p>
          </div>
          <button 
            type="submit"
            className="btn-primary w-full"
          >
            List My Spot
          </button>
        </form>
      </div>

      {/* My Listed Spots */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary-700">My Listed Spots</h2>
            <p className="text-sm text-gray-600">Manage your parking spots</p>
          </div>
        </div>
        
        <div className="space-y-3">
          {mySpots.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 mx-auto text-primary-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-primary-600 italic">You have not listed any spots.</p>
              <p className="text-sm text-gray-500 mt-1">List your first spot using the form above!</p>
            </div>
          ) : (
            mySpots.map((spot) => {
              const status = getSpotStatus(spot);
              const currentTime = Math.floor(Date.now() / 1000);
              const canClaim = spot.isBooked && currentTime >= spot.bookingEndTime;

              return (
                <div 
                  key={spot.id} 
                  className="border border-primary-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <p className="font-semibold text-primary-700">{spot.location}</p>
                      </div>
                      <p className="text-sm text-primary-600 mb-2">
                        Price: {ethers.utils.formatEther(spot.price)} ETH
                      </p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                        {status.text}
                      </span>
                    </div>
                    {canClaim && (
                      <button 
                        onClick={() => handleClaimPayment(spot)}
                        className="btn-primary whitespace-nowrap"
                      >
                        Claim Payment
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default HostView;
