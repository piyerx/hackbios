import React, { useState } from 'react';
import { ethers } from 'ethers';

const DriverView = ({ availableSpots, contract, setLoading, setNotification, onRefresh }) => {
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [bookingDetails, setBookingDetails] = useState({
    hours: 1,
    vehicleNumber: '',
    phoneNumber: '',
    useEVCharging: false
  });

  const handleBookNowClick = (spot) => {
    setSelectedSpot(spot);
    setShowBookingForm(true);
    setBookingDetails({
      hours: 1,
      vehicleNumber: '',
      phoneNumber: '',
      useEVCharging: false
    });
  };

  const handleConfirmBooking = async () => {
    if (!bookingDetails.vehicleNumber || !bookingDetails.phoneNumber) {
      setNotification({ 
        type: 'error', 
        message: 'Please fill in all details' 
      });
      return;
    }

    try {
      setLoading('Processing payment and booking...');
      
      // Calculate total cost with EV charging if selected
      let totalCost = selectedSpot.price.mul(bookingDetails.hours);
      if (bookingDetails.useEVCharging) {
        totalCost = totalCost.mul(120).div(100); // Add 20% for EV charging
      }
      
      const tx = await contract.bookSpot(selectedSpot.id, bookingDetails.hours, { 
        value: totalCost 
      });
      await tx.wait();
      setLoading(null);
      setShowBookingForm(false);
      setNotification({ 
        type: 'success', 
        message: `Successfully booked parking at ${selectedSpot.location}!${bookingDetails.useEVCharging ? ' (EV Charging included)' : ''}` 
      });
      await onRefresh();
    } catch (error) {
      setLoading(null);
      console.error('Error booking spot:', error);
      
      if (error.code === 4001) {
        setNotification({ type: 'error', message: 'Transaction rejected by user.' });
      } else if (error.message?.includes('insufficient funds')) {
        setNotification({ type: 'error', message: 'Insufficient funds to complete this booking.' });
      } else {
        setNotification({ type: 'error', message: 'Failed to book spot. Please try again.' });
      }
    }
  };

  if (showBookingForm && selectedSpot) {
    return (
      <div className="space-y-4">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-primary-700">Booking Details</h2>
            <button 
              onClick={() => setShowBookingForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Selected Spot Info */}
          <div className="bg-primary-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <p className="font-semibold text-primary-700">{selectedSpot.location}</p>
            </div>
            <p className="text-sm text-gray-600 mb-2">{selectedSpot.description}</p>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-primary-600 font-medium">
                {ethers.utils.formatEther(selectedSpot.price)} ETH per hour
              </p>
            </div>
          </div>

          {/* Booking Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (hours)
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={bookingDetails.hours}
                onChange={(e) => setBookingDetails({...bookingDetails, hours: parseInt(e.target.value) || 1})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Number
              </label>
              <input
                type="text"
                placeholder="e.g., ABC-1234"
                value={bookingDetails.vehicleNumber}
                onChange={(e) => setBookingDetails({...bookingDetails, vehicleNumber: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="e.g., +1234567890"
                value={bookingDetails.phoneNumber}
                onChange={(e) => setBookingDetails({...bookingDetails, phoneNumber: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* EV Charging Toggle - Only show if spot has EV charging */}
            {selectedSpot.amenities && selectedSpot.amenities.includes('EV Charging') && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <div>
                      <span className="text-sm font-semibold text-green-800">EV Charging Available</span>
                      <p className="text-xs text-green-600">Additional charge applies if selected</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={bookingDetails.useEVCharging}
                      onChange={(e) => setBookingDetails({...bookingDetails, useEVCharging: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
              </div>
            )}

            {/* Total Cost */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Parking ({bookingDetails.hours}h)</span>
                  <span className="font-medium">{ethers.utils.formatEther(selectedSpot.price.mul(bookingDetails.hours))} ETH</span>
                </div>
                {bookingDetails.useEVCharging && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-green-600 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      EV Charging
                    </span>
                    <span className="font-medium text-green-700">
                      {ethers.utils.formatEther(selectedSpot.price.mul(bookingDetails.hours).mul(20).div(100))} ETH
                    </span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between items-center">
                  <span className="text-gray-700 font-semibold">Total Cost</span>
                  <span className="text-2xl font-bold text-primary-700">
                    {bookingDetails.useEVCharging 
                      ? ethers.utils.formatEther(selectedSpot.price.mul(bookingDetails.hours).mul(120).div(100))
                      : ethers.utils.formatEther(selectedSpot.price.mul(bookingDetails.hours))
                    } ETH
                  </span>
                </div>
              </div>
              {bookingDetails.useEVCharging && (
                <p className="text-xs text-green-600 mt-2">
                  * Includes 20% EV charging surcharge
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowBookingForm(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBooking}
                className="flex-1 btn-primary"
              >
                Confirm & Pay
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary-700">Available Parking Spots</h2>
            <p className="text-sm text-gray-600">Find and book parking near you</p>
          </div>
        </div>
        
        <div className="space-y-3">
          {availableSpots.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 mx-auto text-primary-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-primary-600 italic">No available spots at the moment.</p>
              <p className="text-sm text-gray-500 mt-1">Check back later or list your own spot!</p>
            </div>
          ) : (
            availableSpots.map((spot) => (
              <div 
                key={spot.id} 
                className="border border-primary-200 rounded-lg p-4 hover:border-primary-400 hover:shadow-md transition-all"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <p className="font-semibold text-primary-700">{spot.location}</p>
                      {spot.amenities && spot.amenities.includes('EV Charging') && (
                        <div className="ml-2 flex items-center gap-1 bg-green-100 px-2 py-0.5 rounded-full">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span className="text-xs font-medium text-green-700">EV</span>
                        </div>
                      )}
                    </div>
                    {spot.description && (
                      <p className="text-sm text-gray-600 mb-2">{spot.description}</p>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-primary-600 font-medium">
                        {ethers.utils.formatEther(spot.price)} ETH
                      </p>
                    </div>
                    {spot.amenities && spot.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {spot.amenities.map((amenity, index) => (
                          <span key={index} className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                            {amenity}
                          </span>
                        ))}
                      </div>
                    )}
                    {spot.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm text-gray-600">{spot.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => handleBookNowClick(spot)}
                    className="btn-primary whitespace-nowrap"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverView;
