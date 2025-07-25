import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Service Worker for PWA (only if file exists)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Check if sw.js exists before registering
    fetch('/sw.js', { method: 'HEAD' })
      .then(response => {
        if (response.ok) {
          return navigator.serviceWorker.register('/sw.js');
        }
        throw new Error('Service Worker file not found');
      })
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(error => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}
