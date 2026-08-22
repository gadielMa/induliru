import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles.css';

const pendingRoute = new URLSearchParams(window.location.search).get('route');
if (pendingRoute) {
  window.history.replaceState(null, '', import.meta.env.BASE_URL + pendingRoute);
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);

