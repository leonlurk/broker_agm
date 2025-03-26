import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import VerificationCode from './components/VerificationCode';
import Dashboard from './Dashboard';

function App() {
 const [isAuthenticated, setIsAuthenticated] = useState(false);
 const navigate = useNavigate();
 
 return (
   <Routes>
     <Route path="/login" element={
       <div className="min-h-screen w-full flex items-center justify-end bg-black bg-no-repeat bg-cover bg-center"
         style={{ backgroundImage: 'url(/fondo.png)', width: '100vw', height: '100vh' }}>
         <div className="mr-6 md:mr-6 sm:mx-auto">
           <Login 
             onRegisterClick={() => navigate('/register')} 
             onForgotClick={() => navigate('/forgot-password')}
             onLoginSuccess={() => {
               setIsAuthenticated(true);
               navigate('/dashboard');
             }} 
           />
         </div>
       </div>
     } />
     <Route path="/register" element={
       <div className="min-h-screen w-full flex items-center justify-end bg-black bg-no-repeat bg-cover bg-center"
         style={{ backgroundImage: 'url(/fondo.png)', width: '100vw', height: '100vh' }}>
         <div className="mr-6 md:mr-6 sm:mx-auto">
           <Register onLoginClick={() => navigate('/login')} />
         </div>
       </div>
     } />
     <Route path="/forgot-password" element={
       <div className="min-h-screen w-full flex items-center justify-end bg-black bg-no-repeat bg-cover bg-center"
         style={{ backgroundImage: 'url(/fondo.png)', width: '100vw', height: '100vh' }}>
         <div className="mr-6 md:mr-6 sm:mx-auto">
           <ForgotPassword onContinue={() => navigate('/verification')} onLoginClick={() => navigate('/login')} />
         </div>
       </div>
     } />
     <Route path="/verification" element={
       <div className="min-h-screen w-full flex items-center justify-end bg-black bg-no-repeat bg-cover bg-center"
         style={{ backgroundImage: 'url(/fondo.png)', width: '100vw', height: '100vh' }}>
         <div className="mr-6 md:mr-6 sm:mx-auto">
           <VerificationCode onContinue={() => navigate('/login')} />
         </div>
       </div>
     } />
     <Route path="/dashboard/*" element={isAuthenticated ? <Dashboard onLogout={() => {
       setIsAuthenticated(false);
       navigate('/login');
     }} /> : <Navigate to="/login" />} />
     <Route path="*" element={<Navigate to="/login" />} />
   </Routes>
 );
}

export default App;