import React, { useState, useCallback } from 'react';
import { useEffect } from 'react';
import { Plus, Activity, Shield, AlertTriangle, TrendingUp, Brain } from 'lucide-react';
import { Header } from './Header';
import { VideoStreamCard } from './VideoStreamCard';
import { AddStreamModal } from './AddStreamModal';
import { MapView } from './MapView';
import { AlertPanel } from './AlertPanel';
import { MLAnalytics } from './MLAnalytics';
import { AccidentApprovalModal } from './AccidentApprovalModal';
import { apiService } from '../services/api';
import { socketService } from '../services/socketService';

interface Stream {
  id: string;
  url: string;
  location: string;
  status: 'active' | 'inactive' | 'alert';
}

interface Alert {
  id: string;
  location: string;
  timestamp: Date;
  stream_id: string;
  status: 'pending' | 'sent' | 'acknowledged';
}

export const Dashboard: React.FC = () => {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'streams' | 'analytics'>('streams');
  const [pendingAccident, setPendingAccident] = useState<any>(null);
  const [isApprovingAccident, setIsApprovingAccident] = useState(false);

  // Initialize data and socket connection
  useEffect(() => {
    initializeApp();
    return () => {
      socketService.disconnect();
    };
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      
      // Connect to socket
      await socketService.connect();
      
      // Load initial data
      await Promise.all([
        loadStreams(),
        loadAlerts()
      ]);
      
      // Set up socket event listeners
      setupSocketListeners();
      
    } catch (error) {
      console.error('❌ Failed to initialize app:', error);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStreams = async () => {
    try {
      const response = await apiService.getStreams();
      if (response.data) {
        setStreams(response.data);
      }
    } catch (error) {
      console.error('Failed to load streams:', error);
    }
  };

  const loadAlerts = async () => {
    try {
      const response = await apiService.getAlerts({ limit: 20 });
      if (response.data) {
        setAlerts(response.data);
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  const setupSocketListeners = () => {
    // Stream events
    socketService.onStreamCreated((stream) => {
      setStreams(prev => [stream, ...prev]);
    });

    socketService.onStreamUpdated((stream) => {
      setStreams(prev => prev.map(s => s.id === stream.id ? stream : s));
    });

    socketService.onStreamDeleted((data) => {
      setStreams(prev => prev.filter(s => s.id !== data.id));
    });

    // Alert events
    socketService.onAlertSent((alert) => {
      setAlerts(prev => prev.map(a => a.id === alert.id ? alert : a));
    });

    socketService.onAccidentDetected((data) => {
      setAlerts(prev => [data.alert, ...prev]);
    });

    socketService.on('accident-detected-pending', (data) => {
      setPendingAccident(data);
    });

    socketService.on('alert-approved', (data) => {
      setAlerts(prev => [data.finalAlert, ...prev]);
      setPendingAccident(null);
    });

    socketService.on('alert-rejected', () => {
      setPendingAccident(null);
    });
  };

  const handleAddStream = useCallback(async (url: string, location: string, coordinates?: any) => {
    try {
      const response = await apiService.createStream(url, location, coordinates);
      if (response.data) {
        setStreams(prev => [response.data, ...prev]);
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Failed to create stream:', error);
    }
  }, []);

  const handleStartStream = useCallback(async (streamId: string) => {
    try {
      await apiService.startStream(streamId);
      setStreams(prev => prev.map(s =>
        s.id === streamId ? { ...s, status: 'active' as const } : s
      ));
    } catch (error) {
      console.error('Failed to start stream:', error);
    }
  }, []);

  const handleStopStream = useCallback(async (streamId: string) => {
    try {
      await apiService.stopStream(streamId);
      setStreams(prev => prev.map(s =>
        s.id === streamId ? { ...s, status: 'inactive' as const } : s
      ));
    } catch (error) {
      console.error('Failed to stop stream:', error);
    }
  }, []);

  const handleSendAlert = useCallback(async (alertId: string) => {
    try {
      await apiService.sendAlert(alertId);
      setAlerts(prev => prev.map(a =>
        a.id === alertId ? { ...a, status: 'sent' as const } : a
      ));
    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  }, []);

  const handleApproveAccident = useCallback(async () => {
    if (!pendingAccident) return;

    setIsApprovingAccident(true);
    try {
      await fetch(`/api/pending-alerts/${pendingAccident.pendingAlert.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          approved_by: 'user'
        })
      });
    } catch (error) {
      console.error('Failed to approve accident:', error);
    } finally {
      setIsApprovingAccident(false);
    }
  }, [pendingAccident]);

  const handleRejectAccident = useCallback(async () => {
    if (!pendingAccident) return;

    setIsApprovingAccident(true);
    try {
      await fetch(`/api/pending-alerts/${pendingAccident.pendingAlert.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rejection_reason: 'User rejected',
          approved_by: 'user'
        })
      });
    } catch (error) {
      console.error('Failed to reject accident:', error);
    } finally {
      setIsApprovingAccident(false);
    }
  }, [pendingAccident]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading TrafficWatch AI...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={initializeApp}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Streams</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {streams.filter(s => s.status === 'active').length}
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Alerts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{alerts.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">System Status</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">Online</p>
              </div>
              <Shield className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">AI Accuracy</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">94.7%</p>
              </div>
              <Brain className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl p-1 rounded-xl mb-8">
          <button
            onClick={() => setActiveTab('streams')}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'streams'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Video Streams</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'analytics'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Brain className="h-4 w-4" />
              <span>AI Analytics</span>
            </div>
          </button>
        </div>

        {activeTab === 'streams' ? (
          <div className="space-y-8">
            {/* Video Streams Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Video Streams</h2>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Stream</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {streams.map((stream) => (
                  <VideoStreamCard
                    key={stream.id}
                    id={stream.id}
                    url={stream.url}
                    location={stream.location}
                    status={stream.status}
                    onStart={() => handleStartStream(stream.id)}
                    onStop={() => handleStopStream(stream.id)}
                  />
                ))}
              </div>
              
              {streams.length === 0 && (
                <div className="text-center py-12">
                  <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-2">No video streams added yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Add your first stream to start monitoring
                  </p>
                </div>
              )}
            </div>

            {/* Map View */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Stream Locations</h3>
              <MapView streams={streams} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <MLAnalytics />
            </div>
            <div className="space-y-6">
              <AlertPanel alerts={alerts} onSendAlert={handleSendAlert} />
            </div>
          </div>
        )}
      </main>

      <AddStreamModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddStream}
      />

      <AccidentApprovalModal
        isOpen={!!pendingAccident}
        detectionData={pendingAccident?.detectionResult?.frameAnalysis ? {
          accidents: pendingAccident.detectionResult.accidents || [],
          vehicles: pendingAccident.detectionResult.frameAnalysis,
          frameTimestamp: pendingAccident.detectionResult.timestamp,
          location: pendingAccident.stream?.location || 'Unknown',
          latitude: pendingAccident.stream?.latitude,
          longitude: pendingAccident.stream?.longitude,
          severity: pendingAccident.detectionResult.confidence > 0.85 ? 'critical' : pendingAccident.detectionResult.confidence > 0.75 ? 'high' : 'medium',
          boundingBoxes: pendingAccident.detectionResult.detections || []
        } : null}
        confidence={pendingAccident?.detectionResult?.confidence || 0}
        onApprove={handleApproveAccident}
        onReject={handleRejectAccident}
        isLoading={isApprovingAccident}
      />
    </div>
  );
};