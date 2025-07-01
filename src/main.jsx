import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AccountsProvider } from './contexts/AccountsContext'
import { NotificationsProvider } from './contexts/NotificationsContext'
import ErrorBoundary from './components/ErrorBoundary'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
    <AuthProvider>
        <NotificationsProvider>
          <AccountsProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
          </AccountsProvider>
        </NotificationsProvider>
    </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)