import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import App from './App.jsx'
import AdminApp from './AdminApp.jsx'

const path = window.location.pathname

const RootApp = path.startsWith('/admin')
  ? AdminApp
  : App

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootApp />
  </StrictMode>,
)