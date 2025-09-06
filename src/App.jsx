import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import PasswordReset from './components/PasswordReset';
import VerifyEmail from './components/VerifyEmail';
import EmailVerificationPending from './components/EmailVerificationPending';
import Dashboard from './Dashboard';
import AuthCallback from './components/AuthCallback';
import { useAuth } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { AuthAdapter } from './services/database.adapter';
import { Toaster } from 'react-hot-toast';
// import useKYCStatusMonitor from './hooks/useKYCStatusMonitor';
import useKYCRealtimeMonitor from './hooks/useKYCRealtimeMonitor';
import './i18n/config'; // Importar configuración de i18n

function App() {
  const { currentUser, isAuthenticated, userData } = useAuth();
  const navigate = useNavigate();
  
  // Monitor KYC status changes in real-time
  useKYCRealtimeMonitor();
  
  // NO auto-redirect - users must explicitly login
  // Removed automatic navigation to dashboard
  
  const handleLogout = async () => {
    try {
      console.log("Starting logout process...");
      
      // Call the logout function first
      await AuthAdapter.logoutUser();
      
      // Clear any local storage items that might persist
      localStorage.clear();
      sessionStorage.clear();
      
      // Small delay to ensure cleanup completes
      setTimeout(() => {
        // Force a page reload to clear all state
        window.location.href = '/login';
      }, 100);
      
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout fails, clear local data and redirect
      localStorage.clear();
      sessionStorage.clear();
      
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }
  };

  // Common background wrapper for auth pages
  const AuthPageWrapper = ({ children }) => (
    <div className="min-h-screen w-full flex items-center justify-center bg-black bg-no-repeat bg-cover bg-center"
      style={{ backgroundImage: 'url(/fondo.png)', width: '100vw', height: '100vh' }}>
      <div className="mx-auto">
        {children}
      </div>
    </div>
  );

  return (
    <ChatProvider>
      <Routes>
        <Route 
          path="/login" 
          element={
            <AuthPageWrapper>
              <Login 
                onRegisterClick={() => navigate('/register')} 
                onForgotClick={() => navigate('/forgot-password')}
                onLoginSuccess={() => navigate('/dashboard')} 
              />
            </AuthPageWrapper>
          } 
        />
        
        <Route 
          path="/register" 
          element={
            <AuthPageWrapper>
              <Register onLoginClick={() => navigate('/login')} />
            </AuthPageWrapper>
          } 
        />
        
        <Route 
          path="/forgot-password" 
          element={
            <AuthPageWrapper>
              <ForgotPassword 
                onContinue={() => navigate('/login')} 
                onLoginClick={() => navigate('/login')} 
              />
            </AuthPageWrapper>
          } 
        />
        
        
        <Route 
          path="/reset-password" 
          element={
            <AuthPageWrapper>
              <ResetPassword 
                onContinue={() => navigate('/login')} 
                onLoginClick={() => navigate('/login')} 
              />
            </AuthPageWrapper>
          } 
        />

        <Route 
          path="/auth/callback" 
          element={<AuthCallback />} 
        />

        <Route 
          path="/password-reset" 
          element={
            <AuthPageWrapper>
              <PasswordReset />
            </AuthPageWrapper>
          } 
        />

        <Route 
          path="/verify-email" 
          element={
            <VerifyEmail />
          } 
        />
        
        <Route 
          path="/verify-email-pending" 
          element={
            <EmailVerificationPending />
          } 
        />
        
        <Route 
          path="/dashboard/*" 
          element={
            isAuthenticated ? (
              // Check email verification before allowing dashboard access
              userData?.email_verified === false ? (
                <Navigate to="/verify-email-pending" replace />
              ) : (
                <Dashboard onLogout={handleLogout} user={currentUser} />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        {/* Root route - check authentication and email verification */}
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              userData?.email_verified === false ? (
                <Navigate to="/verify-email-pending" replace />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        {/* Redirect all other routes to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      
      {/* Toast notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#ffffff',
            border: '1px solid #374151',
          },
          success: {
            style: {
              background: '#065f46',
              border: '1px solid #10b981',
            },
          },
          error: {
            style: {
              background: '#7f1d1d',
              border: '1px solid #ef4444',
            },
          },
          loading: {
            style: {
              background: '#1e40af',
              border: '1px solid #3b82f6',
            },
          },
        }}
      />
    </ChatProvider>
  );
}

export default App;