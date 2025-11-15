import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, MapPin, Clock, Zap } from 'lucide-react';

interface DetectionData {
  accidents: any[];
  vehicles: any;
  frameTimestamp: string;
  location: string;
  latitude?: number;
  longitude?: number;
  severity: string;
  boundingBoxes: any[];
}

interface AccidentApprovalModalProps {
  isOpen: boolean;
  detectionData: DetectionData | null;
  confidence: number;
  onApprove: () => void;
  onReject: () => void;
  isLoading?: boolean;
}

export const AccidentApprovalModal: React.FC<AccidentApprovalModalProps> = ({
  isOpen,
  detectionData,
  confidence,
  onApprove,
  onReject,
  isLoading = false
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showReasonInput, setShowReasonInput] = useState(false);

  if (!isOpen || !detectionData) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'high': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors = getSeverityColor(severity);
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${colors}`}>
        <Zap className="h-4 w-4 mr-1" />
        {severity.toUpperCase()}
      </span>
    );
  };

  const handleReject = () => {
    if (showReasonInput && !rejectionReason.trim()) {
      return;
    }
    onReject();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-8 w-8 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">Accident Detection Pending Approval</h2>
              <p className="text-red-100 text-sm">Review the detection and approve or reject</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Frame Timestamp */}
          <div className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Detection Time</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {new Date(detectionData.frameTimestamp).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <MapPin className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Location</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{detectionData.location}</p>
              {detectionData.latitude && detectionData.longitude && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Coordinates: {detectionData.latitude.toFixed(4)}, {detectionData.longitude.toFixed(4)}
                </p>
              )}
            </div>
          </div>

          {/* Detection Details */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Confidence</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                {(confidence * 100).toFixed(1)}%
              </p>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Vehicles</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                {detectionData.vehicles?.vehicleCount || 0}
              </p>
            </div>

            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Severity</p>
              <div className="mt-2">
                {getSeverityBadge(detectionData.severity)}
              </div>
            </div>
          </div>

          {/* Accidents Details */}
          {detectionData.accidents && detectionData.accidents.length > 0 && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm font-medium text-red-900 dark:text-red-200 mb-3">
                Detected {detectionData.accidents.length} potential collision(s):
              </p>
              <div className="space-y-2">
                {detectionData.accidents.map((accident, idx) => (
                  <div key={idx} className="text-sm text-red-800 dark:text-red-300">
                    <span className="font-medium">{accident.vehicle1}</span>
                    {' '}&harr;{' '}
                    <span className="font-medium">{accident.vehicle2}</span>
                    {' '}
                    <span className="text-xs text-red-600 dark:text-red-400">
                      (Distance: {accident.distance.toFixed(1)}px, Confidence: {(accident.confidence * 100).toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rejection Reason Input */}
          {showReasonInput && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Rejection Reason (optional)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Why are you rejecting this detection?"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={3}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                if (showReasonInput) {
                  handleReject();
                } else {
                  setShowReasonInput(true);
                }
              }}
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle className="h-5 w-5" />
              <span>{showReasonInput ? 'Confirm Rejection' : 'Reject'}</span>
            </button>

            <button
              onClick={onApprove}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-green-300 disabled:to-green-400 text-white rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Approving...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  <span>Approve & Send Alert</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
