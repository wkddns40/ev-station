import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import Evstation from './Evstation';
import { FiltersProvider } from './state/FiltersContext';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 60_000, refetchOnWindowFocus: false } },
});

const container = document.getElementById('root');
if (!container) throw new Error('root element not found');
ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <FiltersProvider>
        <Evstation />
      </FiltersProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
