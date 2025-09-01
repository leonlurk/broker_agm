import { useState, useEffect, useRef } from 'react';
import { AuthAdapter, DatabaseAdapter } from '../services/database.adapter';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import emailServiceProxy from '../services/emailServiceProxy';
import { ChevronDown, Search, Check, X, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

const Register = ({ onLoginClick }) => {
  const { t } = useTranslation('auth');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [countryCode, setCountryCode] = useState('+');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countries, setCountries] = useState([]);
  const [countrySearch, setCountrySearch] = useState('');
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const countryDropdownRef = useRef(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [refId, setRefId] = useState(null);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Password validation requirements
  const passwordRequirements = {
    length: { test: (pwd) => pwd.length >= 12, message: 'Mínimo 12 caracteres' },
    number: { test: (pwd) => /\d/.test(pwd), message: 'Al menos 1 número' },
    uppercase: { test: (pwd) => /[A-Z]/.test(pwd), message: 'Al menos 1 mayúscula' },
    symbol: { test: (pwd) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd), message: 'Al menos 1 símbolo' }
  };

  const validatePassword = (pwd) => {
    return Object.values(passwordRequirements).every(req => req.test(pwd));
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    if (ref) {
      setRefId(ref);
      console.log("[Register] Referral ID detected:", ref);
    }
  }, [location.search]);

  // Fetch countries from API
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await axios.get('https://restcountries.com/v3.1/all?fields=name,idd,translations');
        const countryData = response.data.map(c => ({
          name: c.translations?.spa?.common || c.name.common,
          code: `${c.idd.root}${c.idd.suffixes ? c.idd.suffixes[0] : ''}`
        })).sort((a, b) => a.name.localeCompare(b.name, 'es'));
        setCountries(countryData);
        setFilteredCountries(countryData);
      } catch (error) {
        console.error("Error fetching countries:", error);
        // Fallback to a basic list if API fails
        const fallbackCountries = [
          { name: 'Argentina', code: '+54' },
          { name: 'Brasil', code: '+55' },
          { name: 'Chile', code: '+56' },
          { name: 'Colombia', code: '+57' },
          { name: 'México', code: '+52' },
          { name: 'Perú', code: '+51' },
          { name: 'Uruguay', code: '+598' },
          { name: 'España', code: '+34' },
          { name: 'Estados Unidos', code: '+1' }
        ];
        setCountries(fallbackCountries);
        setFilteredCountries(fallbackCountries);
      }
    };
    fetchCountries();
  }, []);

  // Filter countries based on search
  useEffect(() => {
    if (!countrySearch) {
      setFilteredCountries(countries);
    } else {
      const filtered = countries.filter(country =>
        country.name.toLowerCase().includes(countrySearch.toLowerCase())
      );
      setFilteredCountries(filtered);
    }
  }, [countrySearch, countries]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        setIsCountryDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage(''); // Clear previous message
    console.log(`[Register] handleSubmit initiated. Username: ${username}, Email: ${email}, RefId: ${refId}`);
    
    // Validate password requirements
    if (!validatePassword(password)) {
      console.log("[Register] Password doesn't meet requirements.");
      return setError('La contraseña debe tener al menos 12 caracteres, 1 número, 1 mayúscula y 1 símbolo');
    }
    
    if (password !== confirmPassword) {
      console.log("[Register] Password mismatch.");
      return setError(t('register.errors.passwordMismatch'));
    }
    
    if (!acceptTerms) {
      return setError(t('register.errors.termsRequired'));
    }
    
    setLoading(true);
    console.log("[Register] Calling registerUser function...");
    try {
      // Pass refId to registerUser
      const { user, error } = await AuthAdapter.registerUser(username, email, password, refId); 
      
      if (error) {
        console.error("[Register] registerUser returned error:", error);
        // Handle specific Firebase errors if needed
        let friendlyError = t('register.errors.registrationFailed');
        if (error.code === 'auth/email-already-in-use') {
          friendlyError = t('register.errors.emailExists');
        } else if (error.code === 'auth/weak-password') {
          friendlyError = t('register.errors.weakPassword');
        } else if (error.code === 'auth/invalid-email') {
          friendlyError = t('register.errors.invalidEmail');
        } else if (error.code === 'USERNAME_EXISTS') {
          friendlyError = t('register.errors.usernameExists');
        } else if (error.message) {
          // Use the message from the error if available (like permission denied)
          friendlyError = error.message;
        }
        throw new Error(friendlyError);
      }
      
      // Success
      console.log('[Register] Registration successful, user object:', user);
      
      // Save additional user data to database
      if (user && user.id) {
        try {
          const additionalData = {
            nombre: firstName,
            apellido: lastName,
            pais: country,
            phonecode: countryCode,
            phonenumber: phoneNumber,
            username: username,
            email: email
          };
          
          await DatabaseAdapter.users.update(user.id, additionalData);
          console.log('[Register] Additional user data saved successfully');
        } catch (dbError) {
          console.error('[Register] Error saving additional user data:', dbError);
          // Don't block registration if this fails
        }
      }
      
      // NO auto-login - redirect to email verification page
      console.log('[Register] Registration successful, redirecting to email verification page');
      
      // Clear sensitive form data
      setPassword('');
      setConfirmPassword('');
      
      // Send verification email if needed
      if (user.needs_email_verification) {
        try {
          // Send verification email  
          await emailServiceProxy.sendVerificationEmail({
            email: user.email,
            verificationToken: user.verification_token
          });
          console.log('[Register] Verification email sent');
        } catch (emailError) {
          console.error('[Register] Error sending verification email:', emailError);
        }
      }
      
      // Navigate to email verification pending page
      navigate('/verify-email-pending');
    } catch (err) {
      console.error('[Register] handleSubmit caught error:', err);
      setError(err.message || t('register.errors.general'));
    } finally {
      console.log("[Register] handleSubmit finished.");
      setLoading(false);
    }
  };

  return (
    <div className="w-[330px] h-[700px] sm:w-full md:w-[490px] p-5 rounded-3xl bg-black bg-opacity-60 border border-gray-800 shadow-xl flex flex-col justify-center">
      <div className="flex justify-center mb-6">
        <img src="/logo.png" alt="AGM Logo" className="h-16" />
      </div>
      
      {error && (
        <div className="bg-red-500 bg-opacity-20 border border-red-600 text-white px-4 py-2 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      {message && (
        <div className="bg-green-500 bg-opacity-20 border border-green-600 text-white px-4 py-2 rounded-lg mb-4">
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          {/* Nombre y Apellido en una fila */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-3 rounded-full bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 bg-opacity-20"
                placeholder={t('register.placeholders.firstName')}
                required
              />
            </div>
            <div className="relative">
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-3 rounded-full bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 bg-opacity-20"
                placeholder={t('register.placeholders.lastName')}
                required
              />
            </div>
          </div>

          {/* Usuario y Email en una fila */}
          <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-full bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10 bg-opacity-20"
              placeholder={t('register.placeholders.username')}
              required
            />
            <svg className="absolute top-3.5 left-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
          
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-full bg-gray-900 border border-gray-700 bg-opacity-20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
              placeholder={t('register.placeholders.email')}
              required
            />
            <svg className="absolute top-3.5 left-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
            </div>
          </div>

          {/* País de Residencia - Nuevo estilo dropdown */}
          <div className="relative" ref={countryDropdownRef}>
            <button
              type="button"
              onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
              className="w-full px-4 py-3 rounded-full bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10 bg-opacity-20 text-left flex items-center justify-between"
              required
            >
              <span className={country ? 'text-white' : 'text-gray-400'}>
                {country || t('register.placeholders.countryResidence')}
              </span>
              <ChevronDown 
                size={20} 
                className={`text-gray-400 transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`} 
              />
            </button>
            <svg className="absolute top-3.5 left-3 h-5 w-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9"></path>
            </svg>
            
            {isCountryDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#404040] border border-[#333] rounded-xl shadow-lg z-50 max-h-60 overflow-hidden">
                <div className="p-3 border-b border-[#333]">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar país..."
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      className="w-full bg-[#2D2D2D] border border-[#444] rounded-xl pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                      autoFocus
                    />
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map((countryItem) => (
                      <button
                        key={countryItem.name}
                        type="button"
                        onClick={() => {
                          setCountry(countryItem.name);
                          setCountryCode(countryItem.code);
                          setCountrySearch('');
                          setIsCountryDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#2D2D2D] transition-colors"
                      >
                        {countryItem.name}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-400">
                      No se encontraron países
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Número de Teléfono */}
          <div className="flex gap-1.5">
            <div className="relative">
              <input
                type="text"
                value={countryCode}
                readOnly
                className="px-2 py-3 rounded-full bg-gray-900 border border-gray-700 text-white bg-opacity-20 w-[65px] text-center text-sm"
                placeholder="+00"
              />
            </div>
            <div className="flex-1">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-3 rounded-full bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 bg-opacity-20"
                placeholder={t('register.placeholders.phoneNumber')}
                required
              />
            </div>
          </div>
          
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setShowPasswordRequirements(true)}
              onBlur={() => setShowPasswordRequirements(false)}
              className="w-full px-4 py-3 rounded-full bg-gray-900 border bg-opacity-20 border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10 pr-12"
              placeholder={t('register.placeholders.password')}
              required
            />
            <svg className="absolute top-1/2 transform -translate-y-1/2 left-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 transform -translate-y-1/2 right-3 text-gray-400 hover:text-gray-300 focus:outline-none"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          {/* Password Requirements */}
          {(showPasswordRequirements || password) && (
            <div className="bg-gray-900 bg-opacity-30 border border-gray-700 rounded-xl p-3 space-y-1">
              <p className="text-xs text-gray-400 mb-2">Requisitos de la contraseña:</p>
              {Object.entries(passwordRequirements).map(([key, req]) => (
                <div key={key} className="flex items-center gap-2 text-xs">
                  {req.test(password) ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <X className="w-3 h-3 text-red-500" />
                  )}
                  <span className={req.test(password) ? 'text-green-400' : 'text-gray-400'}>
                    {req.message}
                  </span>
                </div>
              ))}
            </div>
          )}
          
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-full bg-gray-900 border bg-opacity-20 border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10 pr-12"
              placeholder={t('register.placeholders.confirmPassword')}
              required
            />
            <svg className="absolute top-1/2 transform -translate-y-1/2 left-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
            {/* Show match status if both passwords have content */}
            {confirmPassword && (
              <div className="absolute top-1/2 transform -translate-y-1/2 right-3">
                {password === confirmPassword ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <X className="w-5 h-5 text-red-500" />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center">
          <input
            id="accept_terms"
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="h-4 w-4 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
          />
          <label htmlFor="accept_terms" className="ml-2 block text-gray-300 text-sm">
            {t('register.termsAndConditions')}
          </label>
        </div>

        <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium shadow-lg relative overflow-hidden group"
            >
            <span className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            <span className="relative z-10">{loading ? t('register.processing') : t('register.continue')}</span>
        </button>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onLoginClick}
            className="text-gray-300 hover:text-white bg-transparent"
          >
            {t('register.verifyNow')}
          </button>
          <p className="text-gray-400 mt-1">
            {t('register.alreadyRegistered')} <button type="button" onClick={onLoginClick} className="text-white font-semibold bg-transparent">{t('register.login')}</button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Register;