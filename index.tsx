
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './AppRouter';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const basename = import.meta.env.VITE_CUSTOM_DOMAIN === 'true' ? '/' : '/bloggogogo/';

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <AppRouter />
    </BrowserRouter>
  </React.StrictMode>
);
