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
      dispatch({ type: 'CONNECT_ERROR', payload: error instanceof Error ? error.message : 'Connection failed' });
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
      // Use token authentication
      if (isProduction) {
        console.log('Production mode detected - using DHIS2 session');
        await connectProduction();
        return;
      }
    
      await connect(config);
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