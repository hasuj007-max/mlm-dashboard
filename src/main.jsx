import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AppProvider } from './context/AppContext'
import './styles/global.css'

// Aplicar el tema guardado antes del primer render para evitar parpadeo
document.documentElement.dataset.tema = localStorage.getItem('mlm-dashboard-tema') || 'oscuro'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
)
