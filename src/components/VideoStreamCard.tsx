import React, { useState, useEffect } from 'react';
import { Play, Pause, AlertTriangle, MapPin, Clock } from 'lucide-react';

interface VideoStreamCardProps {
  id: string;
  url: string;
  location: string;
  status: 'active' | 'inactive' | 'alert';
  onStart: () => void;
  onStop: () => void;
}

export const VideoStreamCard: React.FC<VideoStreamCardProps> = ({
  id,
  url,
  location,
  status,
  onStart,
  onStop
}) => {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [detectionActive, setDetectionActive] = useState(false);
  const isPlaying = status === 'active';

  useEffect(() => {
    if (status === 'active') {
      setDetectionActive(true);
      const interval = setInterval(() => {
        setLastUpdate(new Date());
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setDetectionActive(false);
    }
  }, [status]);

  const handlePlayPause = () => {
    if (isPlaying) {
      onStop();
    } else {
      onStart();
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'alert': return 'bg-red-500 animate-pulse';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
      <div className="relative">
        <div className="aspect-video bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-50"></div>
          {isPlaying ? (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 animate-pulse"></div>
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-white text-sm">Processing Video Stream...</p>
                {detectionActive && (
                  <p className="text-green-400 dark:text-green-300 text-xs mt-2 animate-pulse">🤖 AI Detection Active</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center">
              <Play className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-2 group-hover:text-blue-400 transition-colors duration-200" />
              <p className="text-gray-400 dark:text-gray-500 text-sm">Click to start monitoring</p>
            </div>
          )}
        </div>
        
        <div className="absolute top-4 left-4">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()} shadow-lg`}></div>
        </div>
        
        {status === 'alert' && (
          <div className="absolute top-4 right-4 bg-gradient-to-r from-red-600 to-red-700 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 shadow-lg animate-pulse">
            <AlertTriangle className="h-3 w-3" />
            <span>ACCIDENT</span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{location}</h3>
          <button
            onClick={handlePlayPause}
            className="flex items-center space-x-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-xl text-sm transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span>{isPlaying ? 'Stop' : 'Start'}</span>
          </button>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            <span className="truncate">{url}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};