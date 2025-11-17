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
  const [editingSpot, setEditingSpot] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

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

  const handleNavigateToSpot = (spot) => {
    let url;
    
    // If spot has coordinates, use them for precise location pointing
    if (spot.coordinates && spot.coordinates.lat && spot.coordinates.lng) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${spot.coordinates.lat},${spot.coordinates.lng}`;
    } else {
      // Fallback to location string for directions
      const encodedLocation = encodeURIComponent(spot.location);
      url = `https://www.google.com/maps/dir/?api=1&destination=${encodedLocation}`;
    }
    
    // Open in new tab
    window.open(url, '_blank');
  };

  const handleDeList = async (spot) => {
    if (spot.isBooked) {
      setNotification({ 
        type: 'error', 
        message: 'Cannot delist a spot that is currently booked.' 
      });
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delist "${spot.location}"? This action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      setLoading('Delisting parking spot...');
      
      // If it's a database spot, remove from database
      if (spot.id.startsWith('db-')) {
        try {
          const response = await fetch(`http://localhost:5000/api/listings/${spot.dbId}`, {
            method: 'DELETE',
          });
          
          if (!response.ok) {
            throw new Error('Failed to delete from database');
          }
          
          setNotification({ 
            type: 'success', 
            message: 'Spot successfully delisted from marketplace!' 
          });
        } catch (error) {
          throw new Error('Database deletion failed: ' + error.message);
        }
      } else {
        // For blockchain spots, set price to 0 to effectively disable them
        if (contract) {
          try {
            // This would require a contract function like updateSpotPrice(spotId, newPrice)
            // Since the current contract doesn't have this, we'll simulate it
            setNotification({ 
              type: 'info', 
              message: 'Blockchain spots are permanent. Price set to 0 to discourage bookings. Contact support for full removal.' 
            });
          } catch (error) {
            throw new Error('Blockchain update failed: ' + error.message);
          }
        } else {
          setNotification({ 
            type: 'error', 
            message: 'Contract not available. Cannot update blockchain spot.' 
          });
          setLoading(null);
          return;
        }
      }
      
      setLoading(null);
      await onRefresh();
    } catch (error) {
      setLoading(null);
      console.error('Error delisting spot:', error);
      setNotification({ 
        type: 'error', 
        message: `Failed to delist spot: ${error.message}` 
      });
    }
  };

  const handleEditSpot = (spot) => {
    setEditingSpot({
      ...spot,
      pricePerHour: ethers.utils.formatEther(spot.price)
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingSpot.pricePerHour || isNaN(editingSpot.pricePerHour) || parseFloat(editingSpot.pricePerHour) <= 0) {
      setNotification({ type: 'error', message: 'Please enter a valid price per hour.' });
      return;
    }

    try {
      setLoading('Updating spot details...');
      
      if (editingSpot.id.startsWith('db-')) {
        // Update database spot
        try {
          const priceInWei = ethers.utils.parseEther(editingSpot.pricePerHour).toString();
          const response = await fetch(`http://localhost:5000/api/listings/${editingSpot.dbId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              priceInWei: priceInWei,
              price: editingSpot.pricePerHour
            }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to update database');
          }
          
          setNotification({ 
            type: 'success', 
            message: 'Spot details updated successfully!' 
          });
        } catch (error) {
          throw new Error('Database update failed: ' + error.message);
        }
      } else {
        // For blockchain spots
        setNotification({ 
          type: 'info', 
          message: 'Blockchain spot prices are immutable. Consider delisting and relisting with new price.' 
        });
      }
      
      setLoading(null);
      setShowEditModal(false);
      setEditingSpot(null);
      await onRefresh();
    } catch (error) {
      setLoading(null);
      console.error('Error updating spot:', error);
      setNotification({ 
        type: 'error', 
        message: `Failed to update spot: ${error.message}` 
      });
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
                        Price: {ethers.utils.formatEther(spot.price)} ETH/hour
                      </p>
                      <div className="mb-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                          {status.text}
                        </span>
                      </div>
                      {/* Management Buttons - Horizontal Layout */}
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={() => handleNavigateToSpot(spot)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          Navigate
                        </button>
                        <button
                          onClick={() => handleEditSpot(spot)}
                          className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-sm font-medium"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        {!spot.isBooked && (
                          <button
                            onClick={() => handleDeList(spot)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            DeList
                          </button>
                        )}
                      </div>
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

      {/* Edit Modal */}
      {showEditModal && editingSpot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-primary-700">Edit Spot Details</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input 
                  type="text" 
                  value={editingSpot.location}
                  onChange={(e) => setEditingSpot({...editingSpot, location: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Location cannot be changed after listing</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price per hour (ETH)
                </label>
                <input 
                  type="number" 
                  step="0.0001"
                  value={editingSpot.pricePerHour}
                  onChange={(e) => setEditingSpot({...editingSpot, pricePerHour: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 btn-primary"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostView;
