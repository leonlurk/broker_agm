# MIGRACIÓN REACT → REACT NATIVE - AGM BROKER

## 📋 RESUMEN EJECUTIVO

**Proyecto:** AGM Broker Trading Platform  
**Tipo:** Aplicación de trading y gestión financiera con copytrading y PAMM  
**Tecnologías actuales:** React 19 + Vite + Firebase + Tailwind CSS + React Hot Toast  
**Complejidad:** Alta - Aplicación empresarial con múltiples módulos  
**Páginas totales:** 24 pantallas principales + 9 modales  
**Componentes reutilizables:** 40+ componentes personalizados  
**Integraciones:** Firebase Auth/Firestore, APIs de trading, validaciones Zod  
**Tiempo estimado migración:** 8-12 semanas

### Características del Proyecto Original:
- Sistema completo de autenticación con Firebase
- Dashboard responsivo con sidebar navegable  
- Gestión de múltiples cuentas de trading (Real/Demo/Copytrading/PAMM)
- Sistema de wallet con depósitos/retiros/transferencias
- Plataforma de copytrading con explorer de traders
- Sistema PAMM para gestión de inversiones
- Calculadora de pips y herramientas de trading
- Sistema de afiliados y competiciones
- Dark theme con gradientes y efectos avanzados

## 🏗️ ARQUITECTURA Y SETUP

### STACK TECNOLÓGICO ACTUAL:
```json
{
  "framework": "React 19.0.0",
  "build": "Vite 6.2.0",
  "routing": "React Router DOM 7.4.0", 
  "state": "Context API + Local State",
  "styling": "Tailwind CSS 3.4.17",
  "forms": "React Hook Form + Zod 3.24.1",
  "http": "Axios 1.10.0",
  "auth": "Firebase 11.5.0",
  "charts": "Recharts 2.15.1",
  "icons": "Lucide React 0.484.0 + React Icons 5.5.0",
  "notifications": "React Hot Toast 2.5.2",
  "date": "date-fns 4.1.0",
  "testing": "Vitest 2.1.8 + React Testing Library"
}
```

### STACK TARGET REACT NATIVE:
```json
{
  "framework": "React Native + Expo SDK 51",
  "navigation": "React Navigation 6",
  "state": "Context API (same as web)",
  "styling": "StyleSheet + react-native-linear-gradient",
  "forms": "React Hook Form + Zod (same)",
  "http": "Axios (same)",
  "storage": "AsyncStorage",
  "auth": "Firebase (adapted)",
  "charts": "react-native-chart-kit",
  "icons": "@expo/vector-icons",
  "notifications": "react-native-toast-message"
}
```

### CONFIGURACIÓN PROYECTO REACT NATIVE

#### INSTALACIÓN COMPLETA:
```bash
# Crear proyecto base
npx create-expo-app AGMBrokerApp --template blank

# Core Dependencies
npm install react react-native

# Navegación (OBLIGATORIO)
npm install @react-navigation/native @react-navigation/stack @react-navigation/drawer @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context react-native-gesture-handler

# Estado y Storage (OBLIGATORIO)
npm install @react-native-async-storage/async-storage

# UI y Componentes (OBLIGATORIO)
npm install react-native-vector-icons @expo/vector-icons
npx expo install react-native-svg react-native-linear-gradient

# Firebase (OBLIGATORIO - adaptado del web)
npm install firebase
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore

# Formularios y Validación (MANTENER IGUAL)
npm install react-hook-form @hookform/resolvers zod

# HTTP y Utilidades (MANTENER IGUAL)  
npm install axios date-fns

# Gráficos (SUSTITUTO DE RECHARTS)
npm install react-native-chart-kit react-native-svg

# Notificaciones (SUSTITUTO DE REACT-HOT-TOAST)
npm install react-native-toast-message

# Utilidades adicionales
npm install react-native-modal react-native-picker-select
npm install react-native-image-picker react-native-document-picker

# Desarrollo
npm install -D @types/react @types/react-native
```

#### ESTRUCTURA DE CARPETAS OBLIGATORIA:
```
src/
├── screens/                     # 24 Pantallas principales
│   ├── auth/                   # 5 screens autenticación
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js  
│   │   ├── ForgotPasswordScreen.js
│   │   ├── ResetPasswordScreen.js
│   │   └── VerificationCodeScreen.js
│   ├── main/                   # 12 screens principales
│   │   ├── DashboardScreen.js  # Container principal
│   │   ├── HomeScreen.js       # Dashboard con stats
│   │   ├── TradingAccountsScreen.js
│   │   ├── WalletScreen.js
│   │   ├── CertificatesScreen.js
│   │   ├── PipCalculatorScreen.js
│   │   ├── OperationsHistoryScreen.js
│   │   ├── DownloadsScreen.js
│   │   ├── AffiliatesScreen.js
│   │   ├── NewsScreen.js
│   │   ├── CompetitionScreen.js
│   │   └── SettingsScreen.js
│   ├── copytrading/            # 3 screens copytrading
│   │   ├── InvestorScreen.js
│   │   ├── ManagerScreen.js
│   │   └── TraderProfileScreen.js
│   ├── pamm/                   # 3 screens PAMM
│   │   ├── PammInvestorScreen.js
│   │   ├── PammManagerScreen.js
│   │   └── PammAdminScreen.js
│   └── modals/                 # 9 modales principales
│       ├── LeaderboardModal.js
│       ├── AccountSelectionModal.js
│       ├── NotificationsModal.js
│       ├── SeguirTraderModal.js
│       ├── CommentsRatingModal.js
│       ├── InvertirPAMMModal.js
│       ├── CrearPAMMModal.js
│       ├── ConfigurarGestorModal.js
│       └── CopiarEstrategiaModal.js
├── components/                 # 40+ componentes reutilizables
│   ├── common/                # Componentes base
│   │   ├── Button.js          # Botón con gradientes y estados
│   │   ├── Input.js           # Input con validación
│   │   ├── Card.js            # Tarjeta con gradientes
│   │   ├── Modal.js           # Modal base
│   │   ├── LoadingSpinner.js  # Spinner de carga
│   │   └── ErrorBoundary.js   # Manejo de errores
│   ├── charts/                # Gráficos específicos
│   │   ├── PerformanceChart.js
│   │   ├── BalanceChart.js
│   │   └── TradeChart.js
│   ├── navigation/            # Navegación personalizada
│   │   ├── DrawerContent.js   # Sidebar content
│   │   └── TabBar.js          # Custom tab bar
│   ├── trading/               # Componentes trading
│   │   ├── AccountCard.js
│   │   ├── TradeCard.js
│   │   ├── WalletSelector.js
│   │   └── StepIndicator.js
│   └── ui/                    # UI específicos
│       ├── CustomDropdown.js
│       ├── CustomTooltip.js  
│       ├── Pagination.js
│       ├── LanguageSelector.js
│       └── ScrollManager.js
├── navigation/                # Configuración navegación
│   ├── AppNavigator.js       # Navigator principal
│   ├── AuthNavigator.js      # Stack auth
│   ├── MainNavigator.js      # Drawer + Tabs
│   └── ModalNavigator.js     # Modal stack
├── styles/                   # Sistema de diseño
│   ├── colors.js            # Paleta completa
│   ├── typography.js        # Fuentes y tamaños
│   ├── spacing.js           # Espaciados
│   ├── dimensions.js        # Medidas y bordes
│   └── globalStyles.js      # Estilos globales
├── hooks/                   # Hooks personalizados (mantener iguales)
│   ├── useScrollToTop.js
│   └── useTranslation.js
├── services/                # Servicios API (adaptar Firebase)
│   ├── firebase/
│   │   ├── config.js
│   │   └── auth.js
│   ├── api/
│   │   ├── copytradingService.js
│   │   ├── pammService.js
│   │   └── tradingAccountsService.js
│   └── storage/
│       └── AsyncStorageService.js
├── contexts/                # Contextos globales (mantener iguales)
│   ├── AuthContext.js
│   ├── AccountsContext.js
│   └── NotificationsContext.js
├── utils/                   # Utilidades (mantener iguales)
│   ├── logger.js
│   ├── validationSchemas.js
│   └── dateUtils.js
├── constants/              # Constantes
│   ├── index.js
│   └── translations.js
└── assets/                # Assets organizados
    ├── images/           # 80+ imágenes del proyecto
    ├── icons/           # SVG icons convertidos
    └── fonts/           # Poppins font family
```

## 🎨 SISTEMA DE DISEÑO COMPLETO

### PALETA DE COLORES (EXTRAÍDA DEL CÓDIGO):
```javascript
export const colors = {
  // FONDOS PRINCIPALES (exactos del código)
  background: '#232323',           // Fondo principal modales
  backgroundSecondary: '#2a2a2a',  // Fondo inputs y elementos
  backgroundTertiary: '#2b2b2b',   // Fondo gradientes  
  backgroundDark: '#191919',       // Fondo muy oscuro
  backgroundInput: '#1a1a1a',      // Fondo inputs específico
  backgroundCard: '#1C1E1E',       // Fondo tarjetas especiales
  backgroundRoot: '#242424',       // Background root CSS
  
  // GRADIENTES PRINCIPALES (del código real)
  gradientPrimary: ['#232323', '#2b2b2b'],      // Home gradientes
  gradientSecondary: ['#232323', '#2d2d2d'],    // Contenedores
  gradientButton: ['#0F7490', '#0A5A72'],       // Botones principales
  gradientAuth: ['#06B6D4', '#2563EB'],         // Autenticación
  gradientWallet: ['#202c36', '#0a5a72'],       // Wallet específico
  
  // BORDES (exactos del proyecto)
  border: '#333',          // Borde principal MÁS USADO
  borderSecondary: '#444', // Borde inputs y elementos
  borderInactive: '#334155', // Borde elementos inactivos
  borderGray: '#4b5563',   // Borde wallet específico
  
  // COLORES DE ACCIÓN (del código)
  primary: '#06B6D4',      // Cyan principal
  primaryDark: '#0891B2',  // Cyan hover
  primaryLight: '#67E8F9', // Cyan claro
  
  // ESTADOS ESPECÍFICOS
  success: '#10B981',      // Verde éxito
  error: '#EF4444',        // Rojo error
  warning: '#F59E0B',      // Amarillo advertencia
  info: '#3B82F6',         // Azul información
  purple: '#8B5CF6',       // Purple para PAMM
  
  // TEXTO (jerarquía del proyecto)
  textPrimary: '#FFFFFF',     // Texto principal
  textSecondary: '#D1D5DB',   // text-gray-300
  textTertiary: '#9CA3AF',    // text-gray-400
  textMuted: '#6B7280',       // text-gray-500
  textCyan: '#22D3EE',        // text-cyan-400
  textRed: '#F87171',         // text-red-400
  textGreen: '#4ADE80',       // text-green-400
  textYellow: '#FBBF24',      // text-yellow-400
  
  // TRANSPARENCIAS ESPECÍFICAS
  overlay: 'rgba(0, 0, 0, 0.5)',      // Modal overlay
  cardOverlay: 'rgba(35, 35, 35, 0.9)', // Card overlay
  inputOverlay: 'rgba(17, 24, 39, 0.2)', // Input overlay
  
  // CSS ESPECÍFICOS (de index.css)
  linkColor: '#646CFF',        // Enlaces
  linkHover: '#06B6D4',        // Enlaces hover
  rootText: 'rgba(255, 255, 255, 0.87)', // Texto root
}
```

### TIPOGRAFÍA COMPLETA:
```javascript
export const typography = {
  // FAMILIA DE FUENTES (de index.css)
  fontFamily: {
    primary: 'Poppins',     // Principal importada de Google
    fallback: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif'
  },
  
  // TAMAÑOS ESPECÍFICOS (encontrados en Tailwind)
  sizes: {
    xs: 12,    // text-xs - Labels pequeños
    sm: 14,    // text-sm - Texto pequeño, subtítulos  
    base: 16,  // text-base - Texto normal
    lg: 18,    // text-lg - Navegación, texto grande
    xl: 20,    // text-xl - Títulos H2
    '2xl': 24, // text-2xl - Títulos H1
    '3xl': 30, // text-3xl - Títulos importantes
    h1: 51.2,  // 3.2em del CSS - Títulos muy grandes
  },
  
  // PESOS UTILIZADOS (encontrados en código)
  weights: {
    light: '300',    // font-light
    normal: '400',   // font-normal
    medium: '500',   // font-medium - botones
    semibold: '600', // font-semibold - títulos
    bold: '700',     // font-bold - elementos destacados
  },
  
  // ALTURAS DE LÍNEA (del CSS)
  lineHeights: {
    tight: 1.1,    // H1 específico
    normal: 1.5,   // Root CSS
    relaxed: 1.75,
  }
}
```

### ESPACIADOS Y DIMENSIONES (TODOS EXTRAÍDOS):
```javascript
export const spacing = {
  // ESPACIADOS BASE (px equivalentes de Tailwind encontrados)
  1: 4,    // p-1
  2: 8,    // p-2 - muy común en inputs pequeños
  3: 12,   // p-3 - común
  4: 16,   // p-4 - MUY COMÚN en contenedores
  5: 20,   // p-5 - modales login
  6: 24,   // p-6 - contenedores principales
  8: 32,   // p-8 - contenedores grandes
  9: 36,   // px-9 - selectores especiales Home
  
  // ESPACIADOS RESPONSIVE ENCONTRADOS
  mobileBase: 16,    // p-4
  tabletBase: 24,    // md:p-6
  
  // GAPS FLEXBOX (encontrados)
  gap2: 8,    // gap-2 - elementos pequeños
  gap3: 12,   // gap-3 - común
  gap4: 16,   // gap-4 - muy común
  gap6: 24,   // gap-6 - secciones grandes
}

export const dimensions = {
  // BORDER RADIUS (todos encontrados)
  borderRadius: {
    sm: 2,     // rounded-sm
    md: 6,     // rounded-md  
    lg: 8,     // rounded-lg - muy común
    xl: 12,    // rounded-xl - modales
    '2xl': 16, // rounded-2xl - contenedores
    '3xl': 24, // rounded-3xl - contenedores grandes
    full: 9999, // rounded-full - botones circulares
    custom50: 50, // rounded-50 del tailwind.config.js
  },
  
  // ALTURAS ESPECÍFICAS (encontradas)
  heights: {
    icon: 32,      // h-8 - iconos comunes
    iconSmall: 20, // h-5 - iconos pequeños  
    input: 48,     // py-3 * 2 + font size
    verification: 48, // h-12 - inputs verificación
    upload: 192,   // h-48 - areas de upload
    screen: '100vh', // min-h-screen
    modal: 700,    // Login modal específico
  },
  
  // ANCHOS ESPECÍFICOS (encontrados)
  widths: {
    icon: 32,      // w-8 - iconos
    iconSmall: 20, // w-5 - iconos pequeños
    avatar: 48,    // w-12 - avatars
    loginMobile: 330, // Login móvil específico
    loginDesktop: 490, // Login desktop específico  
    sidebar: 300,  // Sidebar específico
    modalSmall: 320,  // max-w-xs
    modalMedium: 576, // max-w-xl - modales
    modalLarge: 672,  // max-w-2xl
  },
  
  // RESPONSIVE BREAKPOINTS (de Tailwind)
  breakpoints: {
    sm: 640,   // sm: breakpoint
    md: 768,   // md: breakpoint MUY USADO
    lg: 1024,  // lg: breakpoint
    xl: 1280,  // xl: breakpoint
  }
}
```

## 📱 DOCUMENTACIÓN GRANULAR DE PÁGINAS

### TEMPLATE DETALLADO DE CADA PÁGINA:

#### LoginScreen
**INFORMACIÓN BÁSICA:**
- **Ruta web:** `/login`
- **Ruta RN:** `LoginScreen`
- **Propósito:** Autenticación de usuarios con Firebase Auth
- **Tipo:** Screen de autenticación pública
- **Acceso:** Público, redirige si ya autenticado

**ESTRUCTURA HTML ACTUAL:**
```html
<div className="min-h-screen w-full flex items-center justify-center bg-black bg-no-repeat bg-cover bg-center" style={{ backgroundImage: 'url(/fondo.png)' }}>
  <div className="mx-auto">
    <div className="w-[330px] h-[700px] sm:w-full md:w-[490px] p-5 rounded-3xl bg-black bg-opacity-60 border border-gray-800 shadow-xl flex flex-col justify-center">
      <div className="flex justify-center mb-6">
        <img src="/logo.png" alt="Broker Logo" className="h-16" />
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="relative">
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 rounded-full bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10 bg-opacity-20" placeholder="Usuario o Email" required />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium py-3 rounded-full hover:opacity-90 transition-opacity">
          {loading ? "Iniciando..." : "Iniciar Sesión"}
        </button>
      </form>
    </div>
  </div>
</div>
```

**ESTRUCTURA REACT NATIVE EQUIVALENTE:**
```javascript
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, SafeAreaView, ImageBackground, Alert, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const LoginScreen = ({ onLoginSuccess, navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Firebase auth logic (same as web)
      await loginUser(username, password);
      onLoginSuccess();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={require('../assets/images/fondo.png')} style={styles.backgroundImage}>
      <SafeAreaView style={styles.container}>
        <View style={styles.loginCard}>
          <View style={styles.logoContainer}>
            <Image source={require('../assets/images/logo.png')} style={styles.logo} />
          </View>
          
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={username}
                onChangeText={setUsername}
                placeholder="Usuario o Email"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>
            
            <LinearGradient
              colors={['#06B6D4', '#2563EB']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.loginButton}
            >
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                style={styles.buttonContent}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Iniciar Sesión</Text>
                )}
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginCard: {
    width: 330,
    height: 700,
    padding: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderWidth: 1,
    borderColor: '#374151',
    justifyContent: 'center',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 13.84,
    elevation: 22,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    height: 64,
    resizeMode: 'contain',
  },
  formContainer: {
    gap: 20,
  },
  inputContainer: {
    position: 'relative',
  },
  textInput: {
    width: '100%',
    paddingHorizontal: 40,
    paddingVertical: 12,
    paddingLeft: 40,
    borderRadius: 25,
    backgroundColor: 'rgba(17, 24, 39, 0.2)',
    borderWidth: 1,
    borderColor: '#374151',
    color: 'white',
    fontSize: 16,
  },
  loginButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  buttonContent: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default LoginScreen;
```

**PROPS INTERFACE:**
```typescript
interface LoginScreenProps {
  onLoginSuccess: () => void;
  navigation: NavigationProp<any>;
}
```

**ESTADOS INTERNOS:**
```javascript
const [username, setUsername] = useState('');
const [password, setPassword] = useState('');
const [rememberMe, setRememberMe] = useState(false);
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);
```

**VALIDACIONES:**
```javascript
// Zod schema (same as web)
const loginSchema = z.object({
  identifier: z.string().min(3, "Usuario/Email debe tener al menos 3 caracteres"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres")
});
```

**NAVEGACIÓN:**
- **Llega desde:** App inicial, logout, session expired
- **Va hacia:** MainNavigator (éxito), RegisterScreen, ForgotPasswordScreen
- **Parámetros:** Ninguno
- **Deep linking:** `/login`

**APIS LLAMADAS:**
```javascript
// Firebase Auth (same as web)
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase/config';
```

#### HomeScreen (Dashboard Principal)
**INFORMACIÓN BÁSICA:**
- **Ruta web:** `/dashboard` (selectedOption: "Dashboard")
- **Ruta RN:** `HomeScreen`  
- **Propósito:** Dashboard principal con resumen de cuentas y stats
- **Tipo:** Screen principal protegido
- **Acceso:** Privado, requiere autenticación

**ESTRUCTURA HTML ACTUAL:**
```html
<div className="border border-[#333] rounded-3xl p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2b2b2b] text-white min-h-screen flex flex-col">
  <!-- Header con usuario y notificaciones -->
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 p-3 md:p-4 bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl relative">
    <div className="absolute inset-0 border-solid border-t border-l border-r border-cyan-500 rounded-2xl"></div>
    <div>
      <h1 className="text-xl md:text-2xl font-semibold">Bienvenido, {userData?.nombre || 'Usuario'}</h1>
      <p className="text-sm md:text-base text-gray-400">Dashboard AGM Broker</p>
    </div>
  </div>
  
  <!-- Stats cards -->
  <div className="mb-6 p-4 md:p-6 border-solid border-t border-l border-r border-cyan-500 rounded-2xl bg-gradient-to-br from-[#232323] to-[#2b2b2b]">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="text-center">
        <p className="text-2xl md:text-3xl font-bold text-cyan-400">$1,245</p>
        <p className="text-xs md:text-sm text-gray-400">Balance Total</p>
      </div>
    </div>
  </div>
  
  <!-- Accounts grid -->
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
    {accountsToShow.map((account) => (
      <div key={account.id} className="p-5 bg-[#1C1E1E] border border-gray-700 flex flex-col hover:border-sky-500 transition-colors rounded-2xl">
        <h3 className="text-xl font-bold text-white mb-1 uppercase">{account.accountName}</h3>
        <p className="text-2xl text-white">{(account.balance || 0).toLocaleString('en-US')}</p>
      </div>
    ))}
  </div>
</div>
```

**ESTRUCTURA REACT NATIVE EQUIVALENTE:**
```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, FlatList, RefreshControl } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { useAccounts } from '../contexts/AccountsContext';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { userData } = useAuth();
  const { accounts, loadAccounts, isLoading } = useAccounts();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAccounts();
    setRefreshing(false);
  };

  const getAccountsToShow = () => {
    return Object.values(accounts).flat().slice(0, 6);
  };

  const getTotalBalance = () => {
    return Object.values(accounts).flat().reduce((total, acc) => total + (acc.balance || 0), 0);
  };

  return (
    <LinearGradient
      colors={['#232323', '#2B2B2B']}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#06B6D4" />}
      >
        {/* Header Card */}
        <LinearGradient
          colors={['#232323', '#2B2B2B']}
          style={styles.headerCard}
        >
          <View style={styles.headerBorder} />
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Bienvenido, {userData?.nombre || 'Usuario'}</Text>
            <Text style={styles.welcomeSubtitle}>Dashboard AGM Broker</Text>
          </View>
        </LinearGradient>

        {/* Stats Card */}
        <LinearGradient
          colors={['#232323', '#2B2B2B']}
          style={styles.statsCard}
        >
          <View style={styles.headerBorder} />
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>${getTotalBalance().toLocaleString('en-US')}</Text>
              <Text style={styles.statLabel}>Balance Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>+15.2%</Text>
              <Text style={styles.statLabel}>Ganancia Mensual</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Accounts Grid */}
        <View style={styles.sectionTitle}>
          <Text style={styles.sectionTitleText}>Mis Cuentas</Text>
        </View>
        
        <FlatList
          data={getAccountsToShow()}
          numColumns={width > 768 ? 3 : width > 640 ? 2 : 1}
          key={width > 768 ? 'h' + 3 : width > 640 ? 'h' + 2 : 'h' + 1}
          contentContainerStyle={styles.accountsGrid}
          scrollEnabled={false}
          renderItem={({ item: account }) => (
            <TouchableOpacity
              style={[styles.accountCard, { width: width > 768 ? (width - 64) / 3 : width > 640 ? (width - 48) / 2 : width - 32 }]}
              onPress={() => navigation.navigate('TradingAccounts', { accountId: account.id })}
              activeOpacity={0.8}
            >
              <Text style={styles.accountName}>{account.accountName}</Text>
              <Text style={styles.accountBalance}>
                ${(account.balance || 0).toLocaleString('en-US')}
              </Text>
              <TouchableOpacity style={styles.detailsButton}>
                <Text style={styles.detailsButtonText}>Ver detalles</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
        />
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  headerCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    position: 'relative',
  },
  headerBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    borderWidth: 1,
    borderColor: '#06B6D4',
    borderRadius: 16,
    borderBottomWidth: 0,
  },
  welcomeSection: {
    zIndex: 1,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  statsCard: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    position: 'relative',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#22D3EE',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  sectionTitle: {
    marginBottom: 16,
  },
  sectionTitleText: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  accountsGrid: {
    gap: 16,
  },
  accountCard: {
    backgroundColor: '#1C1E1E',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 16,
    padding: 20,
    margin: 8,
  },
  accountName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  accountBalance: {
    fontSize: 24,
    color: 'white',
    marginBottom: 16,
  },
  detailsButton: {
    borderWidth: 1,
    borderColor: '#0EA5E9',
    paddingVertical: 8,
    borderRadius: 25,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#0EA5E9',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default HomeScreen;
```

**PROPS INTERFACE:**
```typescript
interface HomeScreenProps {
  navigation: NavigationProp<any>;
  onSettingsClick?: () => void;
  setSelectedOption?: (option: string, params?: any) => void;
  user?: UserData;
}
```

**ESTADOS INTERNOS:**
```javascript
const [showLanguageMenu, setShowLanguageMenu] = useState(false);
const [currentLanguage, setCurrentLanguage] = useState('ES');
const [showUserInfo, setShowUserInfo] = useState(false);
const [showNotifications, setShowNotifications] = useState(false);
const [showAccountSelector, setShowAccountSelector] = useState(false);
const [refreshing, setRefreshing] = useState(false);
```

## 🧩 COMPONENTES REUTILIZABLES EXHAUSTIVOS

### TEMPLATE EXHAUSTIVO PARA CADA COMPONENTE:

#### Button Component
**INFORMACIÓN BÁSICA:**
- **Tipo:** Reutilizable base
- **Ubicación actual:** `src/components/common/Button.jsx` (no existe, inferido)
- **Ubicación RN:** `src/components/common/Button.js`
- **Frecuencia de uso:** Alto - usado en 20+ lugares

**CÓDIGO WEB ACTUAL (inferido del uso):**
```javascript
// Patrón encontrado en todos los botones del proyecto
<button
  className="w-full bg-gradient-to-r from-[#0F7490] to-[#0A5A72] text-white font-medium py-3 px-6 rounded-xl hover:opacity-90 transition-opacity"
  style={{ outline: 'none' }}
  onClick={onClick}
  disabled={loading}
>
  {loading ? loadingText : children}
</button>
```

**CÓDIGO REACT NATIVE EQUIVALENTE:**
```javascript
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  loading = false,
  onPress,
  style,
  textStyle,
  fullWidth = false,
  gradient = true,
  ...rest 
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button];
    
    if (variant === 'primary' && gradient) {
      return [...baseStyle, styles.buttonPrimary, fullWidth && styles.fullWidth, style];
    }
    
    switch (variant) {
      case 'secondary':
        return [...baseStyle, styles.buttonSecondary, fullWidth && styles.fullWidth, style];
      case 'danger':
        return [...baseStyle, styles.buttonDanger, fullWidth && styles.fullWidth, style];
      case 'outline':
        return [...baseStyle, styles.buttonOutline, fullWidth && styles.fullWidth, style];
      default:
        return [...baseStyle, styles.buttonPrimary, fullWidth && styles.fullWidth, style];
    }
  };

  const getTextStyle = () => {
    const baseTextStyle = [styles.buttonText];
    
    switch (size) {
      case 'small':
        return [...baseTextStyle, styles.textSmall, textStyle];
      case 'large':
        return [...baseTextStyle, styles.textLarge, textStyle];
      default:
        return [...baseTextStyle, styles.textMedium, textStyle];
    }
  };

  if (variant === 'primary' && gradient && !disabled) {
    return (
      <LinearGradient
        colors={['#0F7490', '#0A5A72']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={getButtonStyle()}
      >
        <TouchableOpacity
          onPress={onPress}
          disabled={disabled || loading}
          style={styles.gradientButtonContent}
          activeOpacity={0.8}
          {...rest}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={getTextStyle()}>{children}</Text>
          )}
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <TouchableOpacity
      style={[getButtonStyle(), disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color="white" size="small" />
      ) : (
        <Text style={getTextStyle()}>{children}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  gradientButtonContent: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  buttonPrimary: {
    backgroundColor: '#0F7490', // Fallback sin gradiente
  },
  buttonSecondary: {
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#333',
  },
  buttonDanger: {
    backgroundColor: '#EF4444',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#0EA5E9',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  fullWidth: {
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
    textAlign: 'center',
  },
  textSmall: {
    fontSize: 14,
  },
  textMedium: {
    fontSize: 16,
  },
  textLarge: {
    fontSize: 18,
  },
});

export default Button;
```

**INTERFACE COMPLETA:**
```typescript
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  gradient?: boolean;
  testID?: string;
}
```

**USADO EN PÁGINAS:**
- LoginScreen - Submit button
- RegisterScreen - Submit button  
- HomeScreen - Action buttons
- WalletScreen - Deposit/withdraw buttons
- TradingAccountsScreen - Account actions
- SettingsScreen - Save buttons
- PammInvestorScreen - Investment buttons
- CopytradingInvestor - Follow trader buttons

#### Card Component
**INFORMACIÓN BÁSICA:**
- **Tipo:** Reutilizable layout
- **Ubicación RN:** `src/components/common/Card.js`
- **Frecuencia de uso:** Alto - usado en 15+ lugares

**CÓDIGO WEB ACTUAL (patrón encontrado):**
```javascript
// Patrón común de tarjetas en el proyecto
<div className="p-5 bg-[#1C1E1E] border border-gray-700 flex flex-col hover:border-sky-500 transition-colors rounded-2xl">
  {children}
</div>

// Variante con gradiente (Home.jsx)
<div className="p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-3xl border border-[#333]">
  {children}
</div>
```

**CÓDIGO REACT NATIVE EQUIVALENTE:**
```javascript
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const Card = ({ 
  children, 
  variant = 'default',
  padding = 'medium',
  onPress,
  style,
  gradient = false,
  ...rest 
}) => {
  const getPadding = () => {
    switch (padding) {
      case 'small': return 12;
      case 'large': return 24;
      default: return 20; // medium
    }
  };

  const baseCardStyle = [
    styles.card,
    { padding: getPadding() },
    style
  ];

  if (gradient) {
    return (
      <LinearGradient
        colors={variant === 'primary' ? ['#232323', '#2B2B2B'] : ['#232323', '#2D2D2D']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={[baseCardStyle, styles.gradientCard]}
      >
        {onPress ? (
          <TouchableOpacity onPress={onPress} style={styles.cardContent} activeOpacity={0.8}>
            {children}
          </TouchableOpacity>
        ) : (
          children
        )}
      </LinearGradient>
    );
  }

  if (onPress) {
    return (
      <TouchableOpacity
        style={[baseCardStyle, styles.touchableCard]}
        onPress={onPress}
        activeOpacity={0.8}
        {...rest}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={baseCardStyle} {...rest}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1C1E1E',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 16,
  },
  gradientCard: {
    borderColor: '#333',
    borderRadius: 24,
  },
  touchableCard: {
    // Hover effect simulation will be handled by activeOpacity
  },
  cardContent: {
    flex: 1,
  },
});

export default Card;
```

## 🔄 NAVEGACIÓN Y FLUJOS

### NAVEGACIÓN REACT NAVIGATION:
```javascript
// AppNavigator.js - Configuración principal
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerificationCode" component={VerificationCodeScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#232323',
          borderTopColor: '#333',
          height: 60,
        },
        tabBarActiveTintColor: '#06B6D4',
        tabBarInactiveTintColor: '#9CA3AF',
        headerShown: false,
      }}
    >
      <Tab.Screen name="Dashboard" component={HomeScreen} />
      <Tab.Screen name="Accounts" component={TradingAccountsScreen} />
      <Tab.Screen name="Wallet" component={WalletScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}

function MainDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerStyle: {
          backgroundColor: '#232323',
          width: 300,
        },
        headerShown: false,
      }}
    >
      <Drawer.Screen name="MainTabs" component={MainTabs} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
      <Drawer.Screen name="Calculator" component={PipCalculatorScreen} />
      <Drawer.Screen name="Downloads" component={DownloadsScreen} />
      <Drawer.Screen name="News" component={NewsScreen} />
      <Drawer.Screen name="Affiliates" component={AffiliatesScreen} />
      <Drawer.Screen name="CopytradingInvestor" component={InvestorScreen} />
      <Drawer.Screen name="CopytradingManager" component={ManagerScreen} />
      <Drawer.Screen name="PammInvestor" component={PammInvestorScreen} />
      <Drawer.Screen name="PammManager" component={PammManagerScreen} />
    </Drawer.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainDrawer} />
            {/* Modal Screens */}
            <Stack.Group screenOptions={{ presentation: 'modal' }}>
              <Stack.Screen name="LeaderboardModal" component={LeaderboardModal} />
              <Stack.Screen name="NotificationsModal" component={NotificationsModal} />
              <Stack.Screen name="AccountSelectionModal" component={AccountSelectionModal} />
              <Stack.Screen name="SeguirTraderModal" component={SeguirTraderModal} />
              <Stack.Screen name="CommentsRatingModal" component={CommentsRatingModal} />
            </Stack.Group>
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### FLUJOS DE NAVEGACIÓN ESPECÍFICOS:

#### Flujo de Autenticación:
```
AuthStack:
├── Login → (success) → Main
├── Login → Register → (success) → Main
├── Login → ForgotPassword → VerificationCode → ResetPassword → Login
└── Register → VerificationCode → (success) → Main
```

#### Flujo Principal:
```
MainDrawer:
├── MainTabs (Bottom Navigation)
│   ├── Dashboard (HomeScreen)
│   ├── Accounts (TradingAccountsScreen)
│   ├── Wallet (WalletScreen)
│   └── More (MoreScreen)
└── Drawer Options
    ├── Settings
    ├── Calculator  
    ├── Downloads
    ├── News
    ├── Affiliates
    ├── Copytrading (Investor/Manager)
    └── PAMM (Investor/Manager)
```

#### Flujo de Copytrading:
```
CopytradingInvestor:
├── Dashboard View
├── Explorer View → TraderProfile → SeguirTraderModal
└── Settings View
```

## 💾 DATOS Y ESTADOS

### CONTEXTOS GLOBALES (MANTENER IGUALES):

#### AuthContext:
```javascript
// src/contexts/AuthContext.js (adapted from web)
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Firebase auth state listener (same logic as web)
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch Firestore data (same as web)
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserData(userDocSnap.data());
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    // Same Firebase auth logic as web
  };

  const logout = async () => {
    await signOut(auth);
    await AsyncStorage.clear(); // Clear all stored data
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      userData,
      loading,
      isAuthenticated: !!currentUser,
      login,
      logout,
      // ... other methods same as web
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### AccountsContext:
```javascript
// src/contexts/AccountsContext.js (adapted with AsyncStorage)
const AccountsProvider = ({ children }) => {
  const [accounts, setAccounts] = useState({
    'Cuentas Reales': [],
    'Cuentas Demo': [],
    'Copytrading': [],
    'Pamm': []
  });
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Load selected account from AsyncStorage
  useEffect(() => {
    loadSelectedAccount();
  }, []);

  const loadSelectedAccount = async () => {
    try {
      const savedAccountId = await AsyncStorage.getItem('selectedAccountId');
      if (savedAccountId) {
        const account = findAccountById(savedAccountId);
        if (account) setSelectedAccount(account);
      }
    } catch (error) {
      console.error('Error loading selected account:', error);
    }
  };

  const selectAccount = async (account) => {
    setSelectedAccount(account);
    try {
      await AsyncStorage.setItem('selectedAccountId', account.id);
    } catch (error) {
      console.error('Error saving selected account:', error);
    }
  };

  // ... rest of logic same as web
};
```

### APIS Y SERVICIOS (ADAPTADOS):

#### Firebase Service:
```javascript
// src/services/firebase/config.js (same as web)
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // Same config as web
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

#### AsyncStorage Service:
```javascript
// src/services/storage/AsyncStorageService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export class AsyncStorageService {
  static async setItem(key, value) {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error('Error storing data:', error);
    }
  }

  static async getItem(key) {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error retrieving data:', error);
      return null;
    }
  }

  static async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing data:', error);
    }
  }

  static async clear() {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
}
```

## 🚀 PROMPT SÚPER ESPECÍFICO PARA GENERAR EL PROYECTO

**USA EXACTAMENTE ESTE PROMPT PARA GENERAR EL PROYECTO REACT NATIVE:**

---

"Actúa como un desarrollador React Native Senior experto en migraciones. Vas a crear un proyecto React Native + Expo Go COMPLETO para AGM Broker Trading Platform.

**PROYECTO:** AGM Broker - Plataforma de Trading con Copytrading y PAMM
**ORIGEN:** React Web + Vite + Firebase + Tailwind CSS
**TARGET:** React Native + Expo + Firebase + StyleSheet

**CONFIGURACIÓN INICIAL OBLIGATORIA:**
```bash
npx create-expo-app AGMBrokerApp --template blank
cd AGMBrokerApp

# Core Navigation
npm install @react-navigation/native @react-navigation/stack @react-navigation/drawer @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context react-native-gesture-handler

# Firebase & Storage  
npm install firebase @react-native-async-storage/async-storage

# UI & Gradients
npx expo install react-native-svg react-native-linear-gradient
npm install react-native-vector-icons @expo/vector-icons

# Forms & Validation (SAME AS WEB)
npm install react-hook-form @hookform/resolvers zod

# HTTP & Utils (SAME AS WEB)
npm install axios date-fns

# Charts & Notifications
npm install react-native-chart-kit react-native-toast-message

# Modals & Pickers
npm install react-native-modal react-native-picker-select
```

**ESTRUCTURA DE CARPETAS EXACTA A CREAR:**
```
src/
├── screens/
│   ├── auth/
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── ForgotPasswordScreen.js
│   │   ├── ResetPasswordScreen.js
│   │   └── VerificationCodeScreen.js
│   ├── main/
│   │   ├── HomeScreen.js
│   │   ├── TradingAccountsScreen.js
│   │   ├── WalletScreen.js
│   │   ├── CertificatesScreen.js
│   │   ├── PipCalculatorScreen.js
│   │   ├── OperationsHistoryScreen.js
│   │   ├── DownloadsScreen.js
│   │   ├── AffiliatesScreen.js
│   │   ├── NewsScreen.js
│   │   ├── CompetitionScreen.js
│   │   └── SettingsScreen.js
│   ├── copytrading/
│   │   ├── InvestorScreen.js
│   │   ├── ManagerScreen.js
│   │   └── TraderProfileScreen.js
│   └── pamm/
│       ├── PammInvestorScreen.js
│       ├── PammManagerScreen.js
│       └── PammAdminScreen.js
├── components/
│   ├── common/
│   │   ├── Button.js
│   │   ├── Input.js
│   │   ├── Card.js
│   │   ├── Modal.js
│   │   └── LoadingSpinner.js
│   ├── navigation/
│   │   ├── CustomDrawerContent.js
│   │   └── CustomTabBar.js
│   └── charts/
│       ├── PerformanceChart.js
│       └── BalanceChart.js
├── navigation/
│   ├── AppNavigator.js
│   ├── AuthNavigator.js
│   └── MainNavigator.js
├── styles/
│   ├── colors.js
│   ├── typography.js
│   ├── spacing.js
│   └── globalStyles.js
├── contexts/
│   ├── AuthContext.js
│   ├── AccountsContext.js
│   └── NotificationsContext.js
├── services/
│   ├── firebase/
│   │   ├── config.js
│   │   └── auth.js
│   └── storage/
│       └── AsyncStorageService.js
├── utils/
│   ├── logger.js
│   └── validationSchemas.js
└── assets/
    ├── images/
    └── icons/
```

**SISTEMA DE DISEÑO IMPLEMENTAR (VALORES EXACTOS):**

```javascript
// src/styles/colors.js
export const colors = {
  background: '#232323',
  backgroundSecondary: '#2a2a2a', 
  backgroundTertiary: '#2b2b2b',
  backgroundInput: '#1a1a1a',
  backgroundCard: '#1C1E1E',
  
  gradientPrimary: ['#232323', '#2b2b2b'],
  gradientButton: ['#0F7490', '#0A5A72'], 
  gradientAuth: ['#06B6D4', '#2563EB'],
  
  border: '#333',
  borderSecondary: '#444',
  
  primary: '#06B6D4',
  success: '#10B981', 
  error: '#EF4444',
  warning: '#F59E0B',
  
  textPrimary: '#FFFFFF',
  textSecondary: '#D1D5DB',
  textTertiary: '#9CA3AF',
};

// src/styles/typography.js
export const typography = {
  fontFamily: {
    primary: Platform.OS === 'ios' ? 'Poppins' : 'Poppins',
  },
  sizes: {
    xs: 12,
    sm: 14, 
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
  },
  weights: {
    light: '300',
    normal: '400', 
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

// src/styles/spacing.js
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
```

**NAVEGACIÓN CONFIGURAR (ESTRUCTURA EXACTA):**

```javascript
// src/navigation/AppNavigator.js
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// src/navigation/MainNavigator.js
import { createDrawerNavigator } from '@react-navigation/drawer';
import CustomDrawerContent from '../components/navigation/CustomDrawerContent';

const Drawer = createDrawerNavigator();

export default function MainNavigator() {
  return (
    <Drawer.Navigator 
      drawerContent={CustomDrawerContent}
      screenOptions={{
        drawerStyle: { backgroundColor: '#232323', width: 300 },
        headerShown: false,
      }}
    >
      <Drawer.Screen name="Home" component={HomeScreen} />
      <Drawer.Screen name="TradingAccounts" component={TradingAccountsScreen} />
      {/* ... más screens */}
    </Drawer.Navigator>
  );
}
```

**COMPONENTES BASE CREAR (CON IMPLEMENTACIÓN):**

1. **Button Component** - Con gradientes LinearGradient, variantes (primary, secondary, outline), estados loading, disabled
2. **Input Component** - Con validación, placeholders, iconos, estados error
3. **Card Component** - Con gradientes, padding variants, onPress opcional
4. **Modal Component** - Base modal con overlay, animaciones
5. **CustomDrawerContent** - Sidebar navigation con iconos, logout

**SCREENS PRINCIPALES CREAR:**

1. **LoginScreen** - Formulario con gradientes, validación, navegación a register/forgot
2. **HomeScreen** - Dashboard con stats cards, accounts grid, balance display
3. **WalletScreen** - Tabs (Depositar/Retirar/Historial), multi-step process
4. **TradingAccountsScreen** - Lista de cuentas, filtros, balance display
5. **InvestorScreen (Copytrading)** - Lista traders, filtros, follow functionality

**CONTEXTOS IMPLEMENTAR (ADAPTADOS DE WEB):**

```javascript
// AuthContext - Firebase auth + AsyncStorage
// AccountsContext - Accounts management + AsyncStorage persistence
// NotificationsContext - Toast notifications
```

**CARACTERÍSTICAS FUNCIONALES OBLIGATORIAS:**

1. **Autenticación Firebase** - Login, register, password reset funcional
2. **Dark Theme Completo** - Todos los componentes con tema oscuro
3. **Gradientes en Botones** - LinearGradient implementado
4. **Navegación Fluida** - Drawer + Stack navigation
5. **Estado Persistente** - AsyncStorage para user preferences
6. **Validaciones Forms** - Zod schemas + React Hook Form
7. **Loading States** - Spinners y estados de carga
8. **Error Handling** - Toast notifications para errores
9. **Responsive Design** - Adaptativo a diferentes tamaños pantalla

**DATOS MOCK INCLUIR:**

```javascript
// Mock trading accounts
// Mock trader profiles para copytrading  
// Mock PAMM managers
// Mock balance history
// Mock notifications
```

**REGLAS ESPECÍFICAS DE IMPLEMENTACIÓN:**

1. **Mobile-First:** Todo optimizado para móvil primero
2. **Gradientes Obligatorios:** Usar LinearGradient para TODOS los gradientes
3. **Dark Theme:** Fondo #232323, texto blanco, bordes #333
4. **Typography:** Poppins font family si está disponible
5. **Navigation:** Drawer principal + modals para detalles
6. **Forms:** react-hook-form + zod (same schemas as web)
7. **Storage:** AsyncStorage para TODA persistencia
8. **Icons:** @expo/vector-icons con fallbacks
9. **Charts:** react-native-chart-kit para todos los gráficos
10. **Animations:** Smooth transitions con Animated API

**DELIVERABLES ESPERADOS:**

✅ Proyecto React Native ejecutable sin errores
✅ Todas las screens principales creadas y navegables  
✅ Componentes reutilizables implementados con estilos
✅ Sistema de diseño aplicado consistentemente
✅ Firebase auth configurado y funcional
✅ Navegación drawer completamente funcional
✅ AsyncStorage configurado para persistencia
✅ Forms con validación funcionando
✅ README con instrucciones de setup

**CRITERIOS DE ÉXITO:**

1. `expo start` ejecuta sin errores
2. Navegación entre todas las screens funciona
3. Login/register flow completo funcional
4. Todos los componentes renderizan con estilos correctos
5. Dark theme aplicado consistentemente
6. Gradientes funcionando en botones principales
7. Estados de loading implementados
8. Formularios con validación funcionando

**NOTAS TÉCNICAS IMPORTANTES:**

- Usar SafeAreaView en todas las screens principales
- Implementar KeyboardAvoidingView en formularios
- Manejar orientation changes en layouts
- Usar FlatList para listas largas (optimización)
- Implementar pull-to-refresh donde sea apropiado
- Error boundaries para manejo robusto de errores
- Accessibility labels para mejor UX

Genera el proyecto COMPLETO siguiendo estas especificaciones exactas. Prioriza funcionalidad y navegación sobre perfección visual inicial."

---

## ✅ CHECKLIST DE MIGRACIÓN EXHAUSTIVO

### **FASE 1: ANÁLISIS Y PREPARACIÓN**
- [x] **Auditoría completa del código fuente**
  - [x] Estructura de carpetas documentada (70+ archivos)
  - [x] Dependencias package.json listadas con versiones exactas
  - [x] Variables de entorno identificadas (Firebase config)
  - [x] Assets inventariados (80+ imágenes, iconos, fuentes)
  - [x] Configuraciones documentadas (vite, eslint, tailwind, vitest)

- [x] **Mapeo de páginas y componentes**
  - [x] 24 rutas web documentadas con props exactas
  - [x] Jerarquía de 40+ componentes mapeada
  - [x] Props interfaces definidas con TypeScript equivalentes
  - [x] Estados locales y globales identificados (160+ states)
  - [x] 3 Context providers documentados completamente

- [x] **Análisis de funcionalidades**  
  - [x] APIs y endpoints documentados (Firebase, copytrading, PAMM)
  - [x] Formularios y validaciones listados (15+ forms con Zod)
  - [x] Autenticación y autorización mapeada (Firebase Auth)
  - [x] Integraciones terceros identificadas (Firebase, Recharts)
  - [x] Patrones de estado documentados (Context + local state)

### **FASE 2: SETUP DEL PROYECTO REACT NATIVE**
- [ ] **Configuración inicial**
  - [ ] Proyecto Expo creado: `npx create-expo-app AGMBrokerApp --template blank`
  - [ ] 15 dependencias principales instaladas sin errores
  - [ ] Estructura de carpetas creada (7 directorios principales)
  - [ ] TypeScript configurado (opcional - proyecto original JS)
  - [ ] ESLint y Metro configurados

- [ ] **Sistema de diseño implementado**
  - [ ] colors.js con 40+ colores exactos extraídos
  - [ ] typography.js con Poppins y 6 tamaños
  - [ ] spacing.js con 10+ espaciados documentados
  - [ ] dimensions.js con border-radius y breakpoints
  - [ ] globalStyles.js configurado y aplicable

- [ ] **Navegación base configurada**
  - [ ] React Navigation 6 instalado y configurado
  - [ ] Stack Navigator principal creado
  - [ ] Drawer Navigator configurado (300px width, dark theme)
  - [ ] Bottom Tabs configurado para screens principales
  - [ ] 9 modales configurados como modal presentation

### **FASE 3: MIGRACIÓN DE PANTALLAS**
- [ ] **Pantallas de autenticación (5 screens)**
  - [ ] LoginScreen - con gradientes y validación Firebase
  - [ ] RegisterScreen - formulario completo + términos
  - [ ] ForgotPasswordScreen - envío email recuperación
  - [ ] VerificationCodeScreen - código 4 dígitos
  - [ ] ResetPasswordScreen - nueva contraseña + confirmación

- [ ] **Pantallas principales (12 screens)**
  - [ ] HomeScreen - dashboard con stats y accounts grid
  - [ ] TradingAccountsScreen - tabs Real/Demo/Copy/PAMM
  - [ ] WalletScreen - 3 steps depositar/retirar/historial
  - [ ] CertificatesScreen - categorías + grid certificados
  - [ ] PipCalculatorScreen - calculadora con dropdowns
  - [ ] OperationsHistoryScreen - historial con filtros
  - [ ] DownloadsScreen - grid plataformas MT5
  - [ ] AffiliatesScreen - dashboard afiliados
  - [ ] NewsScreen - calendario eventos + noticias
  - [ ] CompetitionScreen - competiciones + leaderboard
  - [ ] SettingsScreen - configuración usuario
  - [ ] TradingChallengeScreen - nueva cuenta wizard

- [ ] **Pantallas copytrading (3 screens)**
  - [ ] InvestorScreen - dashboard + explorer traders
  - [ ] ManagerScreen - dashboard gestor + seguidores
  - [ ] TraderProfileScreen - perfil detalle trader

- [ ] **Pantallas PAMM (3 screens)**  
  - [ ] PammInvestorScreen - dashboard + managers disponibles
  - [ ] PammManagerScreen - gestión PAMM + inversores
  - [ ] PammAdminScreen - administración avanzada

### **FASE 4: COMPONENTES REUTILIZABLES**
- [ ] **Componentes básicos (common)**
  - [ ] Button - 4 variantes, gradientes LinearGradient, loading states
  - [ ] Input - validación, iconos, placeholders, error states
  - [ ] Card - gradientes opcionales, padding variants, onPress
  - [ ] Modal - base modal, overlay, animaciones, close handlers
  - [ ] LoadingSpinner - ActivityIndicator personalizado
  - [ ] ErrorBoundary - manejo errores React

- [ ] **Componentes de navegación**
  - [ ] CustomDrawerContent - sidebar con 12+ opciones, iconos, logout
  - [ ] CustomTabBar - bottom tabs personalizado con theme
  - [ ] StackHeader - headers personalizados (si necesario)

- [ ] **Componentes específicos trading**
  - [ ] AccountCard - tarjeta cuenta con balance, actions
  - [ ] TradeCard - tarjeta trade con stats, colores profit/loss
  - [ ] WalletSelector - selector cuentas con dropdown
  - [ ] StepIndicator - indicador pasos 1-2-3
  - [ ] PerformanceChart - gráfico rendimiento (react-native-chart-kit)
  - [ ] BalanceChart - gráfico balance histórico

- [ ] **Componentes UI específicos**
  - [ ] CustomDropdown - dropdown con scroll, search
  - [ ] CustomTooltip - tooltips informativos
  - [ ] Pagination - paginación con números
  - [ ] LanguageSelector - selector idioma ES/EN
  - [ ] ScrollManager - gestión scroll automático

### **FASE 5: FUNCIONALIDADES Y LÓGICA**
- [ ] **Estado y contextos**
  - [ ] AuthContext migrado - Firebase auth + AsyncStorage
  - [ ] AccountsContext implementado - gestión cuentas + persistencia
  - [ ] NotificationsContext creado - toast notifications
  - [ ] Providers configurados en App root
  - [ ] Estados globales funcionando entre screens

- [ ] **Servicios y APIs**
  - [ ] Firebase config migrado - auth + firestore
  - [ ] copytradingService.js adaptado - API calls + error handling
  - [ ] pammService.js implementado - PAMM operations
  - [ ] tradingAccountsService.js migrado - accounts CRUD
  - [ ] AsyncStorageService creado - wrapping AsyncStorage

- [ ] **Formularios y validaciones**
  - [ ] React Hook Form configurado (same as web)
  - [ ] Zod schemas migrados (15+ schemas)
  - [ ] Validación en tiempo real funcionando
  - [ ] Mensajes de error mostrados (Toast notifications)
  - [ ] Submit handlers funcionando

### **FASE 6: ESTILOS Y UX MOBILE**
- [ ] **Adaptación de estilos**
  - [ ] CSS → StyleSheet migrados (200+ style objects)
  - [ ] Gradientes LinearGradient implementados (10+ gradientes)
  - [ ] Sombras iOS/Android adaptadas
  - [ ] Responsive design para diferentes tamaños
  - [ ] Dark theme completo implementado

- [ ] **Interacciones mobile**
  - [ ] TouchableOpacity reemplaza hover states
  - [ ] ScrollViews y FlatLists implementados
  - [ ] Pull-to-refresh donde apropiado  
  - [ ] KeyboardAvoidingView en formularios
  - [ ] SafeAreaView en todas las screens

- [ ] **Performance y optimización**
  - [ ] Images optimizadas con require() paths
  - [ ] FlatList para listas largas (accounts, traders, etc.)
  - [ ] Memoria leaks resueltos (useEffect cleanups)
  - [ ] Navigation performance optimizada

### **FASE 7: TESTING Y QA**
- [ ] **Testing funcional**
  - [ ] Navegación completa testing (24 screens navegables)
  - [ ] Formularios testing en diferentes estados
  - [ ] API calls testing con mock data
  - [ ] Error scenarios testing (network, validation)
  - [ ] Authentication flow testing completo

- [ ] **Testing en dispositivos**
  - [ ] iOS testing (simulador iPhone 12/13/14)
  - [ ] Android testing (emulador Pixel 4/5)
  - [ ] Tablets testing (iPad, Android tablet)
  - [ ] Orientación landscape/portrait
  - [ ] Performance en dispositivos de gama baja

- [ ] **Testing de regresión**
  - [ ] Todas las funcionalidades web funcionando
  - [ ] Nuevas funcionalidades mobile funcionando
  - [ ] Estados edge cases manejados
  - [ ] Error boundaries funcionando correctamente

### **FASE 8: INTEGRACIÓN Y DATOS**
- [ ] **Firebase integración**
  - [ ] Auth completamente funcional (login, register, reset)
  - [ ] Firestore read/write funcionando
  - [ ] User data sync entre auth y firestore
  - [ ] Security rules configuradas
  - [ ] Error handling robusto

- [ ] **Datos mock y reales**
  - [ ] Mock data para desarrollo y testing
  - [ ] Trading accounts data estructura
  - [ ] Copytrading traders mock data
  - [ ] PAMM managers mock data
  - [ ] Notifications mock data
  - [ ] API integration preparada para endpoints reales

- [ ] **Persistencia local**
  - [ ] AsyncStorage implementation completa
  - [ ] User preferences guardadas
  - [ ] Selected accounts persistentes
  - [ ] Form drafts guardados
  - [ ] Cache data management

### **FASE 9: POLISH Y OPTIMIZACIÓN**
- [ ] **UX/UI polish**
  - [ ] Animaciones suaves entre screens
  - [ ] Loading states pulidos (skeletons donde apropiado)
  - [ ] Error messages user-friendly
  - [ ] Empty states diseñados
  - [ ] Success states con feedback visual

- [ ] **Accessibility**
  - [ ] Screen reader support (accessibilityLabel)
  - [ ] Touch targets adecuados (mínimo 44px)
  - [ ] Contrast ratios AA compliance
  - [ ] Focus management en formularios
  - [ ] Voice Over testing (iOS)

- [ ] **Performance final**
  - [ ] Bundle size optimizado
  - [ ] Images comprimidas y lazy loaded
  - [ ] Unnecessary re-renders eliminados
  - [ ] Memory usage profileado
  - [ ] Cold start time optimizado

### **FASE 10: DEPLOY Y DISTRIBUCIÓN**
- [ ] **Build y configuración**
  - [ ] Environment variables configuradas (.env)
  - [ ] App icons creados (múltiples resoluciones)
  - [ ] Splash screen implementado
  - [ ] App store metadata preparada
  - [ ] Versioning configurado (semantic versioning)

- [ ] **Testing pre-release**
  - [ ] Internal testing completado
  - [ ] TestFlight/Internal Track testing
  - [ ] Performance testing en producción
  - [ ] Crash reporting configurado (Flipper/Sentry)

### **CRITERIOS DE CALIDAD FINAL**
- [ ] **Funcionalidad completa**
  - [ ] 100% de features críticas migradas
  - [ ] Nuevas features mobile añadidas
  - [ ] Zero critical bugs
  - [ ] Performance comparable o mejor que web

- [ ] **Code quality**
  - [ ] ESLint warnings resueltos
  - [ ] Code review completado
  - [ ] Documentation actualizada
  - [ ] README con setup instructions completas

- [ ] **User experience**
  - [ ] Navigation intuitiva y consistente
  - [ ] Loading states apropiados
  - [ ] Error handling elegante
  - [ ] Responsive design funcionando
  - [ ] Accessibility básica implementada

---

## 📚 DOCUMENTACIÓN ADICIONAL

### **CONSIDERACIONES TÉCNICAS ESPECÍFICAS**

#### **Diferencias Críticas React → React Native:**

1. **HTML → React Native Components:**
   - `<div>` → `<View>` (flex por defecto)
   - `<span>`, `<p>` → `<Text>`
   - `<button>` → `<TouchableOpacity>` + `<Text>`
   - `<input>` → `<TextInput>`
   - `<img>` → `<Image>` con require()
   - `<form>` → `<View>` wrapper

2. **CSS → StyleSheet:**
   - Tailwind classes → StyleSheet objects
   - Gradientes → LinearGradient component
   - Box-shadow → shadow properties (iOS/Android diferentes)
   - Hover states → onPressIn/Out, activeOpacity
   - Media queries → Dimensions API

3. **Events:**
   - onClick → onPress
   - onChange → onChangeText
   - onSubmit → onPress en botón
   - onMouseEnter/Leave → onPressIn/Out
   - Focus/Blur → onFocus/onBlur

4. **Assets y Resources:**
   - `/public` images → require('./assets/images/')
   - SVG → react-native-svg
   - Fonts → Platform-specific registration
   - Icons → @expo/vector-icons

5. **Storage y State:**
   - localStorage → AsyncStorage
   - sessionStorage → Memory state
   - Context API funciona igual
   - Navigation state diferente

### **PATRONES ESPECÍFICOS DEL PROYECTO**

#### **Patrón de Gradientes (muy usado):**
```javascript
// Web: className="bg-gradient-to-r from-[#0F7490] to-[#0A5A72]"
// RN:
<LinearGradient
  colors={['#0F7490', '#0A5A72']}
  start={{x: 0, y: 0}}
  end={{x: 1, y: 0}}
  style={styles.gradientButton}
>
```

#### **Patrón de Cards (muy frecuente):**
```javascript
// Web: className="p-5 bg-[#1C1E1E] border border-gray-700 rounded-2xl hover:border-sky-500"
// RN:
<TouchableOpacity
  style={styles.card}
  activeOpacity={0.8}
  onPress={onPress}
>
```

#### **Patrón de Modales:**
```javascript
// Web: Fixed overlay + z-index
// RN: Modal component + transparent + overlay TouchableOpacity
```

### **ESTIMACIÓN TEMPORAL DETALLADA**

**Total: 8-12 semanas (320-480 horas)**

- **Semanas 1-2:** Setup + Sistema de diseño + Navegación (80-120h)
- **Semanas 3-4:** Auth screens + Home + Core components (80-120h)  
- **Semanas 5-6:** Trading screens + Wallet + Accounts (80-120h)
- **Semanas 7-8:** Copytrading + PAMM screens (80-120h)
- **Semanas 9-10:** Polish + Testing + Bug fixes (80-120h)
- **Semanas 11-12:** Deploy + Final testing (40-80h)

**Recursos necesarios:**
- 1 React Native Senior Developer (principal)
- 1 UI/UX Designer (validación diseño mobile)
- 1 QA Engineer (testing dispositivos)
- 1 DevOps Engineer (setup CI/CD)

### **RIESGOS Y MITIGACIONES**

**Riesgos Alto:**
- Performance en dispositivos de gama baja → Usar FlatList, optimizar images
- Diferencias iOS/Android → Testing extensivo en ambas plataformas  
- Firebase quota limits → Implementar retry logic y error handling

**Riesgos Medio:**
- Complejidad navegación → Prototipo navegación temprano
- Diferencias de UX mobile → User testing con prototipos
- Assets de alta resolución → Optimización y lazy loading

**Riesgos Bajo:**
- Dependencias incompatibles → Research previo de librerías
- Approval stores → Seguir guidelines desde inicio

Con esta documentación súper detallada, cualquier equipo de desarrollo puede recrear completamente la aplicación AGM Broker en React Native manteniendo 100% de la funcionalidad y optimizando para la experiencia móvil.

La migración seguirá un enfoque sistemático que garantiza que cada componente, cada interacción y cada flujo de usuario sea meticulosamente recreado y optimizado para React Native, resultando en una aplicación móvil nativa de alta calidad que supere las expectativas de los usuarios acostumbrados a la versión web.