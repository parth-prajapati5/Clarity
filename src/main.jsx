/**
 * main.jsx
 * Vite / React entry point.
 * Mounts the React tree into the #root div defined in index.html.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
