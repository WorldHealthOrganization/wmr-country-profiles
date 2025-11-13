import React from 'react';
import { Globe, Wifi, WifiOff, Home, LogOut } from 'lucide-react';
import { useDHIS2 } from '../context/DHIS2Context';

export function Header() {
  const { isAuthenticated, user, goHome, isLoading, error, disconnect, isProduction } = useDHIS2();
  const isDebug = !isProduction; // Show connection status in development mode

  const getConnectionStatus = () => {
    if (isLoading) return { icon: Wifi, text: 'Connecting...', color: 'text-yellow-500' };
    if (error) return { icon: WifiOff, text: 'Connection Error', color: 'text-red-500' };
    if (isAuthenticated) return { icon: Wifi, text: 'Connected', color: 'text-green-500' };
    return { icon: WifiOff, text: 'Disconnected', color: 'text-gray-500' };
  };

  const status = getConnectionStatus();
  const StatusIcon = status.icon;

  return (
    <header className="bg-white shadow-md border-b border-gray-200 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 print:max-w-full print:mx-0 print:px-0 avoid-break keep-with-next">
        <div className="flex justify-between items-center h-16 print:h-auto">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3 print:space-x-2">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg print:hidden">
              <Globe className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 print:text-lg print:leading-snug">WMR Country Profile {isProduction ? '' : '(Dev)'}</h1>
            </div>
          </div>

          {/* Connection Status and User Info - only show when debug is true */}
          {isDebug && (
            <div className="flex items-center space-x-4 print:hidden">
              {/* Connection Status */}
              <div className="flex flex-col items-end">
                <div className="flex items-center space-x-2">
                  <StatusIcon className={`h-4 w-4 ${status.color}`} />
                  <span className={`text-sm font-medium ${status.color}`}>
                    {status.text}
                  </span>
                </div>
                {error && (
                  <span className="text-xs text-red-600 mt-1 max-w-xs truncate" title={error}>
                    {error}
                  </span>
                )}
              </div>

              {/* User Info and Actions */}
              {isAuthenticated && user && (
                <div className="flex items-center space-x-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.displayName || user.name}</p>
                    <p className="text-xs text-gray-500">@{user.username}</p>
                    {!isProduction && <p className="text-xs text-blue-500">Development Mode</p>}
                  </div>
                  <button
                    onClick={goHome}
                    className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <Home className="h-4 w-4" />
                    <span>Dashboard</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}