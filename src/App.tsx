import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KitchenMenuControl } from './KitchenMenuControl';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <KitchenMenuControl />
    </QueryClientProvider>
  );
}

export default App;
