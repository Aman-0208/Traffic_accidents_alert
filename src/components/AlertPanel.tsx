import React, { useState } from 'react';
import { AlertTriangle, Send, Clock, MapPin, Activity } from 'lucide-react';

interface Alert {
  _id: string;
  location: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'sent' | 'acknowledged' | 'resolved';
  type: 'accident' | 'traffic_jam' | 'weather' | 'system';
  createdAt: string;
  description?: string;
}

interface AlertPanelProps {
  alerts: Alert[];
  onSendAlert: (alertId: string) => void;
}

export const AlertPanel: React.FC<AlertPanelProps> = ({ alerts, onSendAlert }) => {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'high': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'sent': return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20';
      case 'acknowledged': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'resolved': return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
          Alerts & Notifications
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {alerts.length} active
        </span>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No active alerts</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Alerts will appear here when incidents are detected
            </p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert._id}
              className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                selectedAlert?._id === alert._id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => setSelectedAlert(alert)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                      {alert.severity}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                      {alert.status}
                    </span>
                  </div>
                  
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                    {alert.type === 'accident' ? '🚨 Accident Detected' :
                     alert.type === 'traffic_jam' ? '🚦 Traffic Jam' :
                     alert.type === 'weather' ? '🌧️ Weather Alert' :
                     '⚠️ System Alert'}
                  </h4>
                  
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    {alert.location}
                  </div>
                  
                  {alert.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      {alert.description}
                    </p>
                  )}
                  
                  <div className="flex items-center text-xs text-gray-400 dark:text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTime(alert.createdAt)}
                  </div>
                </div>
                
                {alert.status === 'pending' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSendAlert(alert._id);
                    }}
                    className="ml-2 p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Send Alert"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {selectedAlert && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            Alert Details
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">ID:</span>
              <span className="text-gray-900 dark:text-white font-mono">{selectedAlert._id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Type:</span>
              <span className="text-gray-900 dark:text-white capitalize">{selectedAlert.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Severity:</span>
              <span className={`font-medium ${getSeverityColor(selectedAlert.severity).split(' ')[0]}`}>
                {selectedAlert.severity}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Status:</span>
              <span className={`font-medium ${getStatusColor(selectedAlert.status).split(' ')[0]}`}>
                {selectedAlert.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Created:</span>
              <span className="text-gray-900 dark:text-white">
                {new Date(selectedAlert.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};