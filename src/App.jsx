import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import PasswordReset from './components/PasswordReset';
import VerificationCode from './components/VerificationCode';
import Dashboard from './Dashboard';
import { useAuth } from './contexts/AuthContext';
import { AuthAdapter } from './services/database.adapter';
import { Toaster } from 'react-hot-toast';
// import useKYCStatusMonitor from './hooks/useKYCStatusMonitor';
import useKYCRealtimeMonitor from './hooks/useKYCRealtimeMonitor';
import './i18n/config'; // Importar configuración de i18n

function App() {
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Monitor KYC status changes in real-time
  useKYCRealtimeMonitor();
  
  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated && window.location.pathname === '/login') {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  const handleLogout = async () => {
    try {
      await AuthAdapter.logoutUser();
      navigate('/login');
    } catch (error) {
      console.error("Logout failed", error);
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
    <>
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
                onContinue={() => navigate('/verification')} 
                onLoginClick={() => navigate('/login')} 
              />
            </AuthPageWrapper>
          } 
        />
        
        <Route 
          path="/verification" 
          element={
            <AuthPageWrapper>
              <VerificationCode onContinue={() => navigate('/reset-password')} />
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
          path="/password-reset" 
          element={
            <AuthPageWrapper>
              <PasswordReset />
            </AuthPageWrapper>
          } 
        />
        
        <Route 
          path="/dashboard/*" 
          element={
            isAuthenticated ? (
              <Dashboard onLogout={handleLogout} user={currentUser} />
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
    </>
  );
}

export default App;