// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'; // 1. Importar BrowserRouter
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 2. Envolver la aplicación con el Router */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
