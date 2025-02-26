import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Configuração para dispositivos mais antigos
if (!window.Promise) {
  window.Promise = Promise;
}

// Função de fallback para createRoot
const container = document.getElementById('root');
if (!container) throw new Error('Failed to find the root element');

// Tentativa com error boundary
try {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (error) {
  console.error('Error rendering app:', error);
  // Fallback para render legado se necessário
  const ReactDOM = require('react-dom');
  ReactDOM.render(
    <StrictMode>
      <App />
    </StrictMode>,
    container
  );
}
