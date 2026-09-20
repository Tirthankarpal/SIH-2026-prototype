import { useEffect } from 'react';
import { AppRouter } from './app/Router';
import { api } from './lib/supabase';
import './styles/index.css';

function App() {
  useEffect(() => {
    // Attempt to flush offline queue on initial load
    api.flushOfflineQueue();

    // Listen for connection restoration
    const handleOnline = () => api.flushOfflineQueue();
    window.addEventListener('online', handleOnline);

    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return <AppRouter />;
}

export default App;
