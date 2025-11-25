import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthState, DHIS2Config, DHIS2User } from '../types/dhis2';
import { dhis2Service } from '../services/dhis2Service';

// Check if running in DHIS2 environment
function isRunningInDHIS2(): boolean {
  return typeof window !== 'undefined' && 
         (window.location.href.includes('/dhis-web-') || 
          window.location.href.includes('/api/apps/') ||
          document.cookie.includes('JSESSIONID'));
}

interface DHIS2ContextType extends AuthState {
  connect: (config: DHIS2Config) => Promise<void>;
  disconnect: () => void;
  goHome: () => void;
  isConnecting: boolean;
  isProduction: boolean;
}

const DHIS2Context = createContext<DHIS2ContextType | undefined>(undefined);

type AuthAction =
  | { type: 'CONNECT_START' }
  | { type: 'CONNECT_SUCCESS'; payload: DHIS2User }
  | { type: 'CONNECT_ERROR'; payload: string }
  | { type: 'DISCONNECT' }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: false,
  error: null,
  user: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'CONNECT_START':
      return { ...state, isLoading: true, error: null };
    case 'CONNECT_SUCCESS':
      return { ...state, isAuthenticated: true, isLoading: false, user: action.payload, error: null };
    case 'CONNECT_ERROR':
      return { ...state, isAuthenticated: false, isLoading: false, error: action.payload, user: null };
    case 'DISCONNECT':
      return { ...initialState };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

export function DHIS2Provider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [isProduction] = React.useState(isRunningInDHIS2());

  const connect = async (config: DHIS2Config) => {
    try {
      setIsConnecting(true);
      dispatch({ type: 'CONNECT_START' });
      
      dhis2Service.setConfig(config);
      const user = await dhis2Service.authenticate();
      
      dispatch({ type: 'CONNECT_SUCCESS', payload: user });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      dispatch({ type: 'CONNECT_ERROR', payload: errorMessage });
    } finally {
      setIsConnecting(false);
    }
  };

  const connectProduction = async () => {
    try {
      setIsConnecting(true);
      dispatch({ type: 'CONNECT_START' });
      
      dhis2Service.initializeProduction();
      const user = await dhis2Service.authenticate();
      
      dispatch({ type: 'CONNECT_SUCCESS', payload: user });
    } catch (error) {
      dispatch({ type: 'CONNECT_ERROR', payload: error instanceof Error ? error.message : 'Production connection failed' });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    dhis2Service.disconnect();
    dispatch({ type: 'DISCONNECT' });
  };

  const goHome = () => {
    // Navigate to DHIS2 dashboard
    if (isProduction) {
      // In production, navigate to DHIS2 dashboard
      window.location.href = '/dhis-web-dashboard/index.html#/';
      return;
    }
    const baseUrl = window.location.origin + window.location.pathname.split('/').slice(0, -1).join('/');
    window.location.href = baseUrl + '/dhis-web-dashboard/index.html#';
  };

  // Auto-connect on mount
  useEffect(() => {
    const autoConnect = async () => {
      if (isProduction) {
        await connectProduction();
        return;
      }
    
      // Development mode - using environment variables
      let baseUrl = import.meta.env.VITE_DHIS2_BASE_URL || 'http://localhost:8080/dhis2';
      const token = import.meta.env.VITE_DHIS2_TOKEN;
      const username = import.meta.env.VITE_DHIS2_USERNAME;
      const password = import.meta.env.VITE_DHIS2_PASSWORD;
      
      // Validate base URL - should NOT be the dev server URL
      if (baseUrl.includes('localhost:5173') || baseUrl.includes('127.0.0.1:5173')) {
        const errorMsg = 'ERROR: VITE_DHIS2_BASE_URL cannot be the Vite dev server URL (localhost:5173). Please set it to your DHIS2 instance URL (e.g., http://localhost:8080/dhis2)';
        dispatch({ type: 'CONNECT_ERROR', payload: errorMsg });
        return;
      }
      
      // Remove trailing slash if present
      baseUrl = baseUrl.replace(/\/$/, '');
      
      const devConfig: DHIS2Config = {
        baseUrl,
        ...(token ? { token } : username && password ? { username, password } : {})
      };
      
      if (!token && !username) {
        const errorMsg = 'DHIS2 credentials not configured. Please set VITE_DHIS2_TOKEN or VITE_DHIS2_USERNAME/VITE_DHIS2_PASSWORD in .env file and restart the dev server';
        dispatch({ type: 'CONNECT_ERROR', payload: errorMsg });
        return;
      }
      
      await connect(devConfig);
    };
    
    autoConnect();
  }, [isProduction]);

  return (
    <DHIS2Context.Provider 
      value={{ 
        ...state, 
        connect, 
        disconnect, 
        goHome,
        isConnecting,
        isProduction
      }}
    >
      {children}
    </DHIS2Context.Provider>
  );
}

export function useDHIS2() {
  const context = useContext(DHIS2Context);
  if (context === undefined) {
    throw new Error('useDHIS2 must be used within a DHIS2Provider');
  }
  return context;
}