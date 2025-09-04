import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './lib/i18n';
import { I18nextProvider } from 'react-i18next';
import i18n from './lib/i18n';
import { setupErrorHandler } from './lib/errorHandler';
import { setupAutoCacheCleanup } from './lib/cacheManager';


// Configurar manejador de errores personalizado
setupErrorHandler();

// Configurar limpieza automática de cache en desarrollo
setupAutoCacheCleanup();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </React.StrictMode>,
)
