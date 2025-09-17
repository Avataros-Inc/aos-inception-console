import React from 'react';
import { WifiOff, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { CONNECTION_STATES } from '../constants/connectionStates';

const ConnectionStatus = ({ 
  connectionState, 
  reconnectAttempts = 0, 
  maxReconnectAttempts = 5, 
  lastError = null,
  onRetry = null,
  className = '' 
}) => {
  const getStatusConfig = () => {
    switch (connectionState) {
      case CONNECTION_STATES.CONNECTED:
        return {
          icon: CheckCircle,
          text: 'Connected',
          bgColor: 'bg-green-500/20',
          textColor: 'text-green-400',
          borderColor: 'border-green-500/30'
        };
      
      case CONNECTION_STATES.CONNECTING:
        return {
          icon: Loader2,
          text: 'Connecting...',
          bgColor: 'bg-blue-500/20',
          textColor: 'text-blue-400',
          borderColor: 'border-blue-500/30',
          animate: 'animate-spin'
        };
      
      case CONNECTION_STATES.RECONNECTING:
        return {
          icon: Loader2,
          text: `Reconnecting... (${reconnectAttempts}/${maxReconnectAttempts})`,
          bgColor: 'bg-yellow-500/20',
          textColor: 'text-yellow-400',
          borderColor: 'border-yellow-500/30',
          animate: 'animate-spin'
        };
      
      case CONNECTION_STATES.ERROR:
        return {
          icon: AlertTriangle,
          text: 'Connection Error',
          bgColor: 'bg-red-500/20',
          textColor: 'text-red-400',
          borderColor: 'border-red-500/30'
        };
      
      case CONNECTION_STATES.DISCONNECTED:
      default:
        return {
          icon: WifiOff,
          text: 'Disconnected',
          bgColor: 'bg-gray-500/20',
          textColor: 'text-gray-400',
          borderColor: 'border-gray-500/30'
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}>
      <IconComponent 
        size={16} 
        className={config.animate || ''} 
      />
      <span>{config.text}</span>
      
      {connectionState === CONNECTION_STATES.ERROR && lastError && (
        <div className="ml-2 text-xs">
          <details>
            <summary className="cursor-pointer hover:text-red-300">Details</summary>
            <div className="mt-1 p-2 bg-red-500/10 rounded text-red-300 max-w-xs">
              <p className="font-medium">{lastError.context || 'Unknown error'}</p>
              <p className="text-xs mt-1">{lastError.message}</p>
            </div>
          </details>
        </div>
      )}
      
      {connectionState === CONNECTION_STATES.ERROR && onRetry && (
        <button
          onClick={onRetry}
          className="ml-2 px-2 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 rounded transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default ConnectionStatus;
