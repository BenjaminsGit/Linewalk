import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { StoreProvider } from './store/store';
import { RouterProvider } from './lib/router';
import { App } from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <RouterProvider>
        <App />
      </RouterProvider>
    </StoreProvider>
  </StrictMode>,
);
