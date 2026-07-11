import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Patch global fetch to resolve relative paths to absolute URLs.
// This resolves Safari's "The string did not match the expected pattern" DOMException in sandboxed iframes.
(function() {
  const originalFetch = window.fetch;
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    let url = '';
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.toString();
    } else {
      url = input.url;
    }
    
    // Resolve relative API paths to absolute URLs using current window location origin
    if (url.startsWith('/')) {
      try {
        const origin = window.location.origin;
        if (origin && origin !== 'null') {
          url = `${origin}${url}`;
        }
      } catch (e) {
        // Fallback to absolute match from href
        try {
          const match = window.location.href.match(/^(https?:\/\/[^\/]+)/);
          if (match) {
            url = `${match[1]}${url}`;
          }
        } catch (err) {}
      }
    }
    
    if (typeof input === 'string') {
      return originalFetch.call(this, url, init);
    } else if (input instanceof URL) {
      return originalFetch.call(this, new URL(url), init);
    } else {
      try {
        const newRequest = new Request(url, input);
        return originalFetch.call(this, newRequest, init);
      } catch (e) {
        return originalFetch.call(this, input, init);
      }
    }
  };
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

