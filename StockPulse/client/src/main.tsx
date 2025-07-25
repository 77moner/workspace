
// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  // Temporarily remove StrictMode to prevent double API calls in development
  // In production, you should re-enable StrictMode for better React debugging
  // <StrictMode>
    <App />
  // </StrictMode>,
)

