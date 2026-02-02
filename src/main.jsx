
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import VantaBackground from './components/VantaBackground.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <VantaBackground />
    <App />
  </StrictMode>,
)
