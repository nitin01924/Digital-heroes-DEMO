import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AppProvider } from './contexts/AppContext'
import './styles/app.css'
import './styles/settings.css'

createRoot(document.getElementById('root')).render(<BrowserRouter><AppProvider><App /></AppProvider></BrowserRouter>)
