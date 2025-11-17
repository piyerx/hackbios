import React from 'react';

const Tabs = ({ activeView, onViewChange }) => {
  return (
    <div className="flex gap-4 mb-6">
      {/* Main Tab - Find Parking */}
      <button 
        onClick={() => onViewChange('driver')}
        className={`flex-1 px-8 py-5 rounded-lg font-bold text-lg transition-all shadow-md ${
          activeView === 'driver' 
          ? 'bg-primary-600 text-white shadow-lg scale-105' 
          : 'bg-white text-primary-700 hover:bg-primary-50 hover:shadow-lg'
        }`}
      >
        <div className="flex items-center justify-center gap-3">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>Find Parking</span>
        </div>
      </button>

      {/* Secondary Tab - List Your Spot */}
      <button 
        onClick={() => onViewChange('host')}
        className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all ${
          activeView === 'host' 
          ? 'bg-primary-600 text-white shadow-md' 
          : 'bg-white text-primary-700 hover:bg-primary-50 border-2 border-primary-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>List Your Spot</span>
        </div>
      </button>
    </div>
  );
};

export default Tabs;
