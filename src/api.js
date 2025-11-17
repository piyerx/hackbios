// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// API Service
const api = {
  // Health Check
  healthCheck: async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  },

  // Users
  getAllUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/users`);
    return response.json();
  },

  getUserByWallet: async (walletAddress) => {
    const response = await fetch(`${API_BASE_URL}/users/${walletAddress}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to fetch user');
    }
    return response.json();
  },

  createOrUpdateUser: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  // Listings
  getAllListings: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.isBooked !== undefined) {
      params.append('isBooked', filters.isBooked);
    }
    if (filters.hostAddress) {
      params.append('hostAddress', filters.hostAddress);
    }
    
    const url = `${API_BASE_URL}/listings${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    return response.json();
  },

  getListingById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/listings/${id}`);
    return response.json();
  },

  getListingBySpotId: async (spotId) => {
    const response = await fetch(`${API_BASE_URL}/listings/spot/${spotId}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to fetch listing');
    }
    return response.json();
  },

  getListingsByHost: async (hostAddress) => {
    const response = await fetch(`${API_BASE_URL}/listings/host/${hostAddress}`);
    return response.json();
  },

  createListing: async (listingData) => {
    const response = await fetch(`${API_BASE_URL}/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(listingData),
    });
    return response.json();
  },

  updateListing: async (spotId, listingData) => {
    const response = await fetch(`${API_BASE_URL}/listings/${spotId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(listingData),
    });
    return response.json();
  },

  deleteListing: async (spotId) => {
    const response = await fetch(`${API_BASE_URL}/listings/${spotId}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  addReview: async (spotId, reviewData) => {
    const response = await fetch(`${API_BASE_URL}/listings/${spotId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reviewData),
    });
    return response.json();
  },
};

export default api;
