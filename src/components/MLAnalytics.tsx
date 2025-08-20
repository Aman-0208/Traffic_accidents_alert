import React, { useState, useEffect } from 'react';
import { Cloud, Thermometer, Eye, Wind, Car, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { apiService } from '../services/api';

interface WeatherData {
  temperature: number;
  conditions: string;
  visibility: number;
  windSpeed: number;
}

interface TrafficConditions {
  level: string;
  averageSpeed: number;
  congestionIndex: number;
}

interface MLAnalysis {
  weather: WeatherData;
  trafficConditions: TrafficConditions;
  mlResults: any;
  riskAssessment: {
    overallRisk: number;
    factors: {
      weather: string[];
      traffic: string[];
      ml: string[];
    };
  };
  recommendations: string[];
}

export const MLAnalytics: React.FC = () => {
  const [analysis, setAnalysis] = useState<MLAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalysis();
  }, []);

  const loadAnalysis = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getComprehensiveAnalysis();
      if (response.data) {
        setAnalysis(response.data.analysis);
      } else {
        setError(response.error || 'Failed to load analysis');
      }
    } catch (err) {
      setError('Failed to load analysis');
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk < 0.3) return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
    if (risk < 0.7) return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
    return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
  };

  const getRiskLevel = (risk: number) => {
    if (risk < 0.3) return 'Low';
    if (risk < 0.7) return 'Medium';
    return 'High';
  };

  const getTrafficColor = (level: string) => {
    switch (level) {
      case 'light': return 'text-green-600';
      case 'moderate': return 'text-yellow-600';
      case 'heavy': return 'text-orange-600';
      case 'congested': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          <button
            onClick={loadAnalysis}
            className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="space-y-6">
      {/* Risk Assessment */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
          Risk Assessment
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(analysis.riskAssessment.overallRisk)}`}>
              {getRiskLevel(analysis.riskAssessment.overallRisk)} Risk
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {(analysis.riskAssessment.overallRisk * 100).toFixed(1)}% probability
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {analysis.weather.temperature}°C
            </div>
            <p className="text-xs text-gray-500">{analysis.weather.conditions}</p>
          </div>
          
          <div className="text-center">
            <div className={`text-lg font-semibold ${getTrafficColor(analysis.trafficConditions.level)}`}>
              {analysis.trafficConditions.level.charAt(0).toUpperCase() + analysis.trafficConditions.level.slice(1)}
            </div>
            <p className="text-xs text-gray-500">
              {analysis.trafficConditions.averageSpeed.toFixed(0)} mph avg
            </p>
          </div>
        </div>
      </div>

      {/* Weather & Traffic Conditions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weather */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Cloud className="h-5 w-5 mr-2 text-blue-500" />
            Weather Conditions
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Thermometer className="h-4 w-4 text-red-500 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Temperature</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {analysis.weather.temperature}°C
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Eye className="h-4 w-4 text-blue-500 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Visibility</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {(analysis.weather.visibility / 1000).toFixed(1)} km
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Wind className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Wind Speed</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {analysis.weather.windSpeed.toFixed(1)} m/s
              </span>
            </div>
          </div>
        </div>

        {/* Traffic */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Car className="h-5 w-5 mr-2 text-green-500" />
            Traffic Conditions
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 text-purple-500 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Level</span>
              </div>
              <span className={`font-medium ${getTrafficColor(analysis.trafficConditions.level)}`}>
                {analysis.trafficConditions.level.charAt(0).toUpperCase() + analysis.trafficConditions.level.slice(1)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Car className="h-4 w-4 text-blue-500 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Avg Speed</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {analysis.trafficConditions.averageSpeed.toFixed(0)} mph
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-orange-500 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Congestion</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {(analysis.trafficConditions.congestionIndex * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Factors */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Risk Factors</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
              <Cloud className="h-4 w-4 text-blue-500 mr-2" />
              Weather
            </h4>
            <ul className="space-y-1">
              {analysis.riskAssessment.factors.weather.map((risk, index) => (
                <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  {risk}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
              <Car className="h-4 w-4 text-green-500 mr-2" />
              Traffic
            </h4>
            <ul className="space-y-1">
              {analysis.riskAssessment.factors.traffic.map((risk, index) => (
                <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  {risk}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
              <AlertTriangle className="h-4 w-4 text-orange-500 mr-2" />
              ML Detection
            </h4>
            <ul className="space-y-1">
              {analysis.riskAssessment.factors.ml.map((risk, index) => (
                <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recommendations</h3>
        
        <div className="space-y-2">
          {analysis.recommendations.map((recommendation, index) => (
            <div key={index} className="flex items-start">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <p className="text-sm text-gray-700 dark:text-gray-300">{recommendation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={loadAnalysis}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Refresh Analysis
        </button>
      </div>
    </div>
  );
}; 