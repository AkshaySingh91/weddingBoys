// src/main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import ScrollOnTop from './Component/ScrollOnTop.jsx';

const root = createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <ScrollOnTop />
    <App />
  </BrowserRouter>
);
