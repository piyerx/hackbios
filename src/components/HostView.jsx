import React, { useState } from 'react';
import { ethers } from 'ethers';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const HostView = ({ mySpots, contract, setLoading, setNotification, onRefresh }) => {
  const [formData, setFormData] = useState({
    spotName: '',
    location: '',
    pricePerHour: '',
    duration: '120',
    evCharging: false,
    coordinates: { lat: 20.5937, lng: 78.9629 } // Default to India center
  });
  const [showMap, setShowMap] = useState(false);

  // Component to handle map clicks
  function LocationMarker() {
    useMapEvents({
      click(e) {
        handleMapClick(e.latlng);
      },
    });

    return formData.coordinates.lat && formData.coordinates.lng ? (
      <Marker position={[formData.coordinates.lat, formData.coordinates.lng]}>
        <Popup>Selected Location</Popup>
      </Marker>
    ) : null;
  }

  const handleMapClick = async (latlng) => {
    setFormData(prev => ({
      ...prev,
      coordinates: { lat: latlng.lat, lng: latlng.lng }
    }));
    
    // Reverse geocode to get address
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`
      );
      const data = await response.json();
      if (data.display_name) {
        setFormData(prev => ({
          ...prev,
          location: data.display_name
        }));
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      setNotification({ type: 'info', message: 'Getting your location...' });
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setFormData(prev => ({
            ...prev,
            coordinates: { lat: latitude, lng: longitude }
          }));
          setShowMap(true);
          
          // Reverse geocode to get address
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            if (data.display_name) {
              setFormData(prev => ({
                ...prev,
                location: data.display_name
              }));
            }
            setNotification({ 
              type: 'success', 
              message: 'Location captured successfully!' 
            });
          } catch (error) {
            console.error('Error reverse geocoding:', error);
            setNotification({ 
              type: 'success', 
              message: 'Location captured! Please enter address manually.' 
            });
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setNotification({ 
            type: 'error', 
            message: 'Failed to get location. Please enter manually.' 
          });
        }
      );
    } else {
      setNotification({ 
        type: 'error', 
        message: 'Geolocation is not supported by your browser.' 
      });
    }
  };

  const handleListSpot = async (e) => {
    e.preventDefault();
    
    if (!formData.spotName.trim() || !formData.location.trim()) {
      setNotification({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }
    
    if (!formData.pricePerHour || isNaN(formData.pricePerHour) || parseFloat(formData.pricePerHour) <= 0) {
      setNotification({ type: 'error', message: 'Please enter a valid price per hour in ETH.' });
      return;
    }

    try {
      const priceInWei = ethers.utils.parseEther(formData.pricePerHour);
      
      setLoading('Listing parking spot...');
      const tx = await contract.listSpot(formData.location, priceInWei);
      await tx.wait();
      setLoading(null);
      setNotification({ 
        type: 'success', 
        message: 'Spot listed successfully!' 
      });
      
      // Reset form
      setFormData({
        spotName: '',
        location: '',
        pricePerHour: '',
        duration: '120',
        evCharging: false,
        coordinates: { lat: null, lng: null }
      });
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
      const spotId = spot.blockchainId !== undefined ? spot.blockchainId : spot.id;
      const tx = await contract.claimPayment(spotId);
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
            <label htmlFor="spotName" className="block text-sm font-medium text-gray-700 mb-2">
              Parking space name
            </label>
            <input 
              type="text" 
              id="spotName"
              value={formData.spotName}
              onChange={(e) => handleInputChange('spotName', e.target.value)}
              placeholder="E.g. Ocean View Driveway" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location (auto / manual)
            </label>
            <div className="flex gap-2">
              <input 
                type="text" 
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Street, zone, or custom instructions" 
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleGetLocation}
                className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Auto
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="pricePerHour" className="block text-sm font-medium text-gray-700 mb-2">
              Price per hour (ETH)
            </label>
            <input 
              type="number" 
              step="0.0001"
              id="pricePerHour"
              value={formData.pricePerHour}
              onChange={(e) => handleInputChange('pricePerHour', e.target.value)}
              placeholder="0.01" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
              Booking duration (minutes)
            </label>
            <input 
              type="number" 
              id="duration"
              value={formData.duration}
              onChange={(e) => handleInputChange('duration', e.target.value)}
              placeholder="120" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">EV charging available</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData.evCharging}
                onChange={(e) => handleInputChange('evCharging', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          {formData.coordinates.lat && formData.coordinates.lng && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
              <p className="text-sm text-primary-700 font-medium mb-1">Location Captured</p>
              <p className="text-xs text-gray-600">
                Lat: {formData.coordinates.lat.toFixed(6)}, Lng: {formData.coordinates.lng.toFixed(6)}
              </p>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-800 mb-1">Transaction Fee Notice</p>
                <p className="text-xs text-yellow-700">
                  Listing your spot requires a small gas fee (transaction fee) to store your listing on the blockchain. 
                  This is NOT a platform fee - it goes to network validators. The actual amount varies based on network 
                  congestion (typically $0.50-$2 USD worth of SepoliaETH).
                </p>
              </div>
            </div>
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
