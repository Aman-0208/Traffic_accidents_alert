import React from 'react';
import { MapPin, AlertTriangle, Shield, Heart, Video } from 'lucide-react';

interface Stream {
  _id: string;
  url: string;
  location: string;
  status: 'active' | 'inactive' | 'alert';
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface MapViewProps {
  streams: Stream[];
}

export const MapView: React.FC<MapViewProps> = ({ streams }) => {
  const policeStations = [
    { id: 1, name: 'Central Police Station', lat: 40.7589, lng: -73.9851, type: 'police' },
    { id: 2, name: 'Downtown Precinct', lat: 40.7505, lng: -73.9934, type: 'police' },
    { id: 3, name: 'North District HQ', lat: 40.7829, lng: -73.9654, type: 'police' },
  ];

  const hospitals = [
    { id: 1, name: 'City General Hospital', lat: 40.7614, lng: -73.9776, type: 'hospital' },
    { id: 2, name: 'Metropolitan Medical Center', lat: 40.7489, lng: -73.9680, type: 'hospital' },
    { id: 3, name: 'Emergency Care Hospital', lat: 40.7505, lng: -73.9934, type: 'hospital' },
    { id: 4, name: 'St. Mary\'s Hospital', lat: 40.7829, lng: -73.9654, type: 'hospital' },
  ];

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
      <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
        <h2 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Live Map View</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Stream locations, police stations, and hospitals</p>
      </div>
      
      <div className="relative">
        {/* Simulated Map */}
        <div className="h-96 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
          <div className="absolute inset-0 opacity-30 dark:opacity-20">
            <svg className="w-full h-full" viewBox="0 0 400 300">
              {/* Simulated street grid */}
              <defs>
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
                </pattern>
                <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1"/>
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1"/>
                </linearGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              <rect width="100%" height="100%" fill="url(#mapGradient)" />
            </svg>
          </div>
          
          {/* Police Stations */}
          {policeStations.map((station, index) => (
            <div
              key={station.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${20 + index * 25}%`,
                top: `${30 + index * 20}%`,
              }}
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 rounded-xl shadow-xl flex items-center space-x-2 text-xs border border-blue-500/50 backdrop-blur-sm">
                <Shield className="h-4 w-4 drop-shadow-sm" />
                <span>{station.name}</span>
              </div>
            </div>
          ))}
          
          {/* Hospitals */}
          {hospitals.map((hospital, index) => (
            <div
              key={hospital.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${25 + index * 20}%`,
                top: `${60 + index * 15}%`,
              }}
            >
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-3 rounded-xl shadow-xl flex items-center space-x-2 text-xs border border-red-400/50 backdrop-blur-sm">
                <Heart className="h-4 w-4 drop-shadow-sm" />
                <span>{hospital.name}</span>
              </div>
            </div>
          ))}
          
          {/* Stream Locations */}
          {streams.map((stream, index) => (
            <div
              key={stream._id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${45 + index * 15}%`,
                top: `${40 + index * 10}%`,
              }}
            >
              <div className={`p-3 rounded-xl shadow-xl flex items-center space-x-2 text-xs border backdrop-blur-sm ${
                stream.status === 'active' 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-400/50' 
                  : stream.status === 'alert'
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-400/50 animate-pulse'
                  : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-gray-400/50'
              }`}>
                <Video className="h-4 w-4 drop-shadow-sm" />
                <span>{stream.location}</span>
                {stream.status === 'active' && (
                  <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                )}
                {stream.status === 'alert' && (
                  <AlertTriangle className="h-3 w-3" />
                )}
              </div>
            </div>
          ))}
          
          {streams.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">No streams added yet</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs">Add streams to see them on the map</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Legend */}
      <div className="p-4 bg-gray-50/50 dark:bg-gray-700/50 border-t border-gray-200/50 dark:border-gray-600/50">
        <div className="flex items-center justify-center space-x-6 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-300">Active Streams</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-300">Alert Streams</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-300">Police Stations</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-600 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-300">Hospitals</span>
          </div>
        </div>
      </div>
    </div>
  );
};