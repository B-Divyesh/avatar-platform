import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ContractProvider } from './context/ContractContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <ContractProvider>
        <App />
      </ContractProvider>
    </AuthProvider>
  </React.StrictMode>
);