import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const originalFetch = window.fetch;
window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const basePath = (window as any).__STUDIO_CONFIG__?.basePath || '';

  let url: string;
  if (typeof input === 'string') {
    url = input;
  } else if (input instanceof URL) {
    url = input.toString();
  } else if (input instanceof Request) {
    url = input.url;
  } else {
    url = '';
  }

  const isStudioApiCall = url.startsWith('/api/') && 
    !url.startsWith('/api/auth/') && 
    basePath && 
    !url.startsWith(basePath);

  if (isStudioApiCall) {
    url = basePath + url.slice(4);

    if (typeof input === 'string') {
      input = url;
    } else if (input instanceof URL) {
      input = new URL(url, window.location.origin);
    } else if (input instanceof Request) {
      input = new Request(url, input);
    }
  }

  return originalFetch.call(window, input, init);
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
