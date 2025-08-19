# MIGRACIÓN REACT → REACT NATIVE

## CONFIGURACIÓN INICIAL DEL PROYECTO

### Dependencias React Native necesarias:

```bash
# Crear proyecto con Expo
npx create-expo-app AGMBrokerApp --template blank

# Navegación
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context react-native-gesture-handler

# Estado y almacenamiento
npm install @react-native-async-storage/async-storage

# Iconos y UI
npm install react-native-vector-icons @expo/vector-icons
npx expo install react-native-svg

# Firebase
npm install firebase

# Formularios y validación
npm install react-hook-form zod

# Utilidades
npm install date-fns axios

# Gráficos
npm install react-native-chart-kit react-native-svg

# Notificaciones Toast
npm install react-native-toast-message

# Dropdown y modal
npm install react-native-modal react-native-picker-select
```

### Estructura de carpetas:
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
│   │   ├── DashboardScreen.js
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
│   │   ├── TradingChallengeScreen.js
│   │   └── SettingsScreen.js
│   ├── copytrading/
│   │   ├── InvestorScreen.js
│   │   ├── ManagerScreen.js
│   │   └── CopytradingDashboardScreen.js
│   ├── pamm/
│   │   ├── PammInvestorScreen.js
│   │   ├── PammManagerScreen.js
│   │   └── PammAdminScreen.js
│   └── modals/
│       ├── LeaderboardModal.js
│       ├── AccountSelectionModal.js
│       ├── NotificationsModal.js
│       └── TraderProfileModal.js
├── components/
│   ├── common/
│   │   ├── Button.js
│   │   ├── Input.js
│   │   ├── Card.js
│   │   ├── Modal.js
│   │   ├── LoadingSpinner.js
│   │   └── ErrorBoundary.js
│   ├── charts/
│   │   ├── PerformanceChart.js
│   │   ├── BalanceChart.js
│   │   └── TradeChart.js
│   ├── navigation/
│   │   ├── DrawerContent.js
│   │   ├── TabNavigator.js
│   │   └── StackNavigator.js
│   └── ui/
│       ├── CustomDropdown.js
│       ├── CustomTooltip.js
│       ├── Pagination.js
│       └── LanguageSelector.js
├── navigation/
│   ├── AppNavigator.js
│   ├── AuthNavigator.js
│   └── MainNavigator.js
├── styles/
│   ├── colors.js
│   ├── typography.js
│   ├── spacing.js
│   └── globalStyles.js
├── utils/
│   ├── logger.js
│   ├── validationSchemas.js
│   ├── dateUtils.js
│   └── formatters.js
├── services/
│   ├── firebase/
│   │   ├── config.js
│   │   └── auth.js
│   ├── api/
│   │   ├── copytradingService.js
│   │   ├── pammService.js
│   │   └── tradingAccountsService.js
│   └── storage/
│       └── AsyncStorageService.js
├── contexts/
│   ├── AuthContext.js
│   ├── AccountsContext.js
│   └── NotificationsContext.js
├── hooks/
│   ├── useAuth.js
│   ├── useAccounts.js
│   └── useTranslation.js
├── constants/
│   ├── index.js
│   └── translations.js
└── assets/
    ├── images/
    ├── icons/
    └── fonts/
```

## ESPECIFICACIONES DE DISEÑO

### Paleta de colores:
```javascript
export const colors = {
  // Colores principales
  primary: '#06b6d4', // cyan-500
  primaryDark: '#0891b2', // cyan-600
  primaryLight: '#67e8f9', // cyan-300
  
  // Colores de acento
  accent: '#0F7490', // Gradiente inicio
  accentDark: '#0A5A72', // Gradiente fin
  
  // Backgrounds principales
  background: '#232323', // Fondo principal
  backgroundSecondary: '#2a2a2a', // Fondo secundario
  backgroundTertiary: '#2d2d2d', // Tarjetas gradiente
  backgroundAuth: '#242424', // Fondo páginas auth
  
  // Backgrounds para inputs y elementos
  inputBackground: '#1a1a1a',
  cardBackground: '#191919',
  
  // Colores de borde
  border: '#333333',
  borderHover: '#444444',
  borderFocus: '#06b6d4',
  
  // Estados
  success: '#10b981', // green-500
  successDark: '#065f46', // green-800
  error: '#ef4444', // red-500
  errorDark: '#7f1d1d', // red-900
  warning: '#f59e0b', // amber-500
  info: '#3b82f6', // blue-500
  
  // Texto
  textPrimary: '#ffffff',
  textSecondary: '#d1d5db', // gray-300
  textTertiary: '#9ca3af', // gray-400
  textMuted: '#6b7280', // gray-500
  
  // Específicos para estados de trading
  profit: '#10b981', // Verde para ganancias
  loss: '#ef4444', // Rojo para pérdidas
  neutral: '#6b7280', // Gris para neutral
  
  // Colores específicos para badges
  premiumBadge: '#fbbf24', // yellow-400
  verifiedBadge: '#3b82f6', // blue-500
  newBadge: '#6b7280', // gray-500
  
  // Riesgo
  riskHigh: '#ef4444', // red-400
  riskMediumHigh: '#f97316', // orange-400
  riskMedium: '#f59e0b', // yellow-400
  riskLow: '#10b981', // green-400
  
  // Transparencias
  overlay: 'rgba(0, 0, 0, 0.5)',
  cardOverlay: 'rgba(35, 35, 35, 0.9)',
}
```

### Tipografía:
```javascript
export const typography = {
  fontFamily: {
    primary: 'Poppins-Regular',
    medium: 'Poppins-Medium',
    semibold: 'Poppins-SemiBold',
    bold: 'Poppins-Bold'
  },
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36
  },
  weights: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800'
  },
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75
  }
}
```

### Espaciados estándar:
```javascript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64
}
```

### Dimensiones y bordes:
```javascript
export const dimensions = {
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    '3xl': 32,
    full: 9999
  },
  screenPadding: 16,
  headerHeight: 60,
  tabBarHeight: 80
}
```

## PÁGINAS DEL PROYECTO

### Authentication Flow

#### LoginScreen
- **Navegación desde:** App inicial, Register, ForgotPassword
- **Navegación hacia:** Dashboard (éxito), Register, ForgotPassword
- **Componentes que contiene:**
  - Input email/password personalizado
  - Botón de login con gradiente
  - Enlaces a registro y recuperación
- **Estados locales:** email, password, loading, errors
- **Funcionalidad:** Autenticación Firebase + validación Zod

#### RegisterScreen
- **Navegación desde:** Login
- **Navegación hacia:** Login (éxito), VerificationCode
- **Componentes que contiene:**
  - Formulario completo de registro
  - Validación en tiempo real
  - Términos y condiciones
- **Estados locales:** formData, validation, loading

#### ForgotPasswordScreen
- **Navegación desde:** Login
- **Navegación hacia:** VerificationCode, Login
- **Funcionalidad:** Envío de código de recuperación

#### VerificationCodeScreen
- **Navegación desde:** ForgotPassword, Register
- **Navegación hacia:** ResetPassword, Dashboard
- **Componentes que contiene:**
  - Input de código de 6 dígitos
  - Timer de reenvío
  - Validación automática

#### ResetPasswordScreen
- **Navegación desde:** VerificationCode
- **Navegación hacia:** Login
- **Funcionalidad:** Cambio de contraseña

### Main Application

#### DashboardScreen (Container Principal)
- **Descripción:** Pantalla contenedora con navegación drawer/tab
- **Componentes que contiene:**
  - DrawerNavigator personalizado
  - Header con notificaciones
  - Área de contenido dinámico
- **Estados globales:** selectedScreen, user data, notifications
- **Navegación:** Maneja toda la navegación interna

#### HomeScreen
- **Descripción:** Dashboard principal con resumen de cuentas
- **Componentes que contiene:**
  - Tarjeta de bienvenida con foto de perfil
  - Resumen de balance total
  - Gráfico de rendimiento mensual
  - Accesos rápidos a funciones principales
  - Lista de cuentas recientes
- **Datos dinámicos:** Balance, profit/loss, account data
- **Estados locales:** selectedPeriod, chartData

#### TradingAccountsScreen
- **Descripción:** Gestión de cuentas de trading (Real/Demo)
- **Componentes que contiene:**
  - Tabs para Real/Demo/Copytrading/PAMM
  - Lista de cuentas con balance y equity
  - Botones de acciones (depositar, retirar, detalles)
  - Modal de selección de cuenta
- **Navegación hacia:** WalletScreen, AccountDetails
- **Estados locales:** activeTab, accounts, selectedAccount

#### WalletScreen
- **Descripción:** Gestión de billetera (depósitos/retiros)
- **Componentes que contiene:**
  - Tabs de Depositar/Retirar/Historial
  - Formularios de transacciones
  - Lista de métodos de pago
  - Historial de operaciones
- **Estados locales:** activeOperation, amount, selectedMethod, history

#### CertificatesScreen
- **Descripción:** Certificados y logros del usuario
- **Componentes que contiene:**
  - Botones de categorías (Superación, Desempeño, etc.)
  - Grid de certificados disponibles
  - Modal de detalle de certificado
- **Estados locales:** activeCategory, certificates

#### PipCalculatorScreen
- **Descripción:** Calculadora de pips para trading
- **Componentes que contiene:**
  - Inputs para símbolo, lotes, precio apertura/cierre
  - Selector de tipo de cuenta
  - Resultado de cálculo en tiempo real
- **Estados locales:** symbol, lots, openPrice, closePrice, result

#### OperationsHistoryScreen
- **Descripción:** Historial de operaciones y pagos
- **Componentes que contiene:**
  - Filtros por fecha y tipo
  - Lista de transacciones
  - Paginación
  - Detalles expandibles
- **Estados locales:** filters, operations, currentPage

#### DownloadsScreen
- **Descripción:** Descargas de MT5 y herramientas
- **Componentes que contiene:**
  - Grid de plataformas (Windows, Mac, Linux, Android, iOS)
  - Enlaces de descarga
  - Guías de instalación
- **Funcionalidad:** Linking a URLs externas

#### AffiliatesScreen
- **Descripción:** Dashboard de afiliados
- **Componentes que contiene:**
  - Código de referido
  - Estadísticas de referidos
  - Comisiones ganadas
  - Gráfico de rendimiento
- **Estados locales:** affiliateData, referralCode

#### NewsScreen
- **Descripción:** Noticias y análisis de mercado
- **Componentes que contiene:**
  - Lista de artículos
  - Categorías de noticias
  - Buscador
  - Modal de detalle de artículo
- **Estados locales:** articles, selectedCategory, searchQuery

#### CompetitionScreen
- **Descripción:** Competiciones y concursos
- **Componentes que contiene:**
  - Lista de competiciones activas
  - Leaderboard modal
  - Detalles de participación
  - Premios y reglas
- **Navegación hacia:** LeaderboardModal
- **Estados locales:** competitions, selectedCompetition

#### TradingChallengeScreen
- **Descripción:** Creación de nuevas cuentas de trading
- **Componentes que contiene:**
  - Selector de tipo de cuenta
  - Configuración de parámetros
  - Resumen de creación
  - Confirmación
- **Estados locales:** accountType, parameters, step

#### SettingsScreen
- **Descripción:** Configuración de usuario
- **Componentes que contiene:**
  - Información personal
  - Métodos de pago
  - Preferencias de idioma
  - Configuración de notificaciones
  - Verificación KYC
- **Estados locales:** userInfo, paymentMethods, preferences

### CopyTrading Module

#### InvestorScreen (Copytrading)
- **Descripción:** Vista de inversor para copy trading
- **Componentes que contiene:**
  - Lista de traders disponibles
  - Filtros de búsqueda
  - Estadísticas de rendimiento
  - Modal de seguir trader
- **Navegación hacia:** TraderProfileDetail, SeguirTraderModal
- **Estados locales:** traders, filters, subscriptions

#### ManagerScreen (Copytrading)
- **Descripción:** Vista de gestor para copy trading
- **Componentes que contiene:**
  - Dashboard de rendimiento
  - Lista de seguidores
  - Configuración de estrategia
  - Estadísticas detalladas
- **Estados locales:** followers, performance, strategy

#### CopytradingDashboardScreen
- **Descripción:** Dashboard general de copy trading
- **Componentes que contiene:**
  - Resumen de posiciones copiadas
  - Rendimiento general
  - Actividad reciente
- **Estados locales:** copyData, positions

### PAMM Module

#### PammInvestorScreen
- **Descripción:** Vista de inversor PAMM
- **Componentes que contiene:**
  - Lista de managers PAMM
  - Filtros y búsqueda
  - Modal de inversión
- **Navegación hacia:** InvertirPAMMModal, PammManagerProfile
- **Estados locales:** managers, filters, investments

#### PammManagerScreen
- **Descripción:** Vista de gestor PAMM
- **Componentes que contiene:**
  - Dashboard de gestión
  - Lista de inversores
  - Configuración de PAMM
- **Estados locales:** investors, pammConfig, performance

#### PammAdminScreen
- **Descripción:** Administración avanzada PAMM
- **Componentes que contiene:**
  - Gestión completa de PAMM
  - Reportes detallados
  - Configuración avanzada
- **Estados locales:** adminData, reports

### Modals Globales

#### LeaderboardModal
- **Descripción:** Ranking de competiciones
- **Componentes que contiene:**
  - Lista de participantes
  - Filtros por competición
  - Estadísticas de usuario
- **Props:** isOpen, onClose, competitionId

#### AccountSelectionModal
- **Descripción:** Selección de cuenta para operaciones
- **Componentes que contiene:**
  - Lista de cuentas disponibles
  - Información de balance
  - Botón de selección
- **Props:** accounts, onSelect, onClose

#### NotificationsModal
- **Descripción:** Centro de notificaciones
- **Componentes que contiene:**
  - Lista de notificaciones
  - Marcado como leído
  - Filtros por tipo
- **Props:** notifications, onClose, onMarkRead

## COMPONENTES REUTILIZABLES

### Common Components

#### Button
- **Propósito:** Botón reutilizable con variantes
- **Props:**
  - title: string
  - onPress: function
  - variant: 'primary' | 'secondary' | 'danger' | 'success'
  - size: 'small' | 'medium' | 'large'
  - disabled: boolean
  - loading: boolean
  - gradient: boolean
- **Estilos aplicados:** Gradientes, estados hover, loading spinner
- **Usado en:** Todas las pantallas

#### Input
- **Propósito:** Input personalizado con validación
- **Props:**
  - value: string
  - onChangeText: function
  - placeholder: string
  - secureTextEntry: boolean
  - keyboardType: string
  - error: string
  - leftIcon: component
  - rightIcon: component
- **Estilos aplicados:** Bordes focus, estados de error
- **Usado en:** Formularios, pantallas de auth

#### Card
- **Propósito:** Contenedor de contenido con estilos
- **Props:**
  - children: ReactNode
  - gradient: boolean
  - padding: number
  - margin: number
  - onPress: function
- **Estilos aplicados:** Gradientes, bordes, sombras
- **Usado en:** Listas, dashboards, detalles

#### Modal
- **Propósito:** Modal base reutilizable
- **Props:**
  - visible: boolean
  - onClose: function
  - children: ReactNode
  - title: string
  - size: 'small' | 'medium' | 'large' | 'fullscreen'
- **Estilos aplicados:** Overlay, animaciones
- **Usado en:** Confirmaciones, formularios, detalles

### Charts Components

#### PerformanceChart
- **Propósito:** Gráfico de rendimiento temporal
- **Props:**
  - data: array
  - period: string
  - currency: string
- **Usado en:** HomeScreen, ProfileScreens

#### BalanceChart
- **Propósito:** Gráfico de balance histórico
- **Props:**
  - balanceData: array
  - timeframe: string
- **Usado en:** WalletScreen, AccountDetails

### Navigation Components

#### DrawerContent
- **Propósito:** Contenido personalizado del drawer
- **Props:**
  - user: object
  - onLogout: function
  - selectedRoute: string
- **Usado en:** Navegación principal

#### TabNavigator
- **Propósito:** Tabs personalizados para secciones
- **Props:**
  - tabs: array
  - activeTab: string
  - onTabChange: function
- **Usado en:** TradingAccounts, Wallet, otras pantallas con tabs

### UI Components

#### CustomDropdown
- **Propósito:** Dropdown personalizado
- **Props:**
  - options: array
  - value: any
  - onSelect: function
  - placeholder: string
- **Usado en:** Formularios, filtros

#### LanguageSelector
- **Propósito:** Selector de idioma
- **Props:**
  - currentLanguage: string
  - onLanguageChange: function
- **Usado en:** Settings, Header

## NAVEGACIÓN

### Stack Principal:
```javascript
// AppNavigator.js
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthNavigator} />
        <Stack.Screen name="Main" component={MainNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// AuthNavigator.js
const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerificationCode" component={VerificationCodeScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
};

// MainNavigator.js
const MainNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={props => <DrawerContent {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Drawer.Screen name="Home" component={HomeScreen} />
      <Drawer.Screen name="TradingAccounts" component={TradingAccountsScreen} />
      <Drawer.Screen name="Wallet" component={WalletScreen} />
      <Drawer.Screen name="Calculator" component={PipCalculatorScreen} />
      <Drawer.Screen name="Downloads" component={DownloadsScreen} />
      <Drawer.Screen name="News" component={NewsScreen} />
      <Drawer.Screen name="Affiliates" component={AffiliatesScreen} />
      <Drawer.Screen name="CopytradingInvestor" component={InvestorScreen} />
      <Drawer.Screen name="CopytradingManager" component={ManagerScreen} />
      <Drawer.Screen name="PammInvestor" component={PammInvestorScreen} />
      <Drawer.Screen name="PammManager" component={PammManagerScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
      
      {/* Modals */}
      <Drawer.Screen 
        name="LeaderboardModal" 
        component={LeaderboardModal}
        options={{ presentation: 'modal' }}
      />
    </Drawer.Navigator>
  );
};
```

### Flujos de navegación:

#### Flujo de autenticación:
Login → Register → VerificationCode → ResetPassword → Login → Dashboard

#### Flujo principal:
Home → TradingAccounts → AccountDetails → Wallet → Operations

#### Flujo de copytrading:
Home → CopytradingInvestor → TraderProfile → FollowTrader → CopytradingDashboard

#### Flujo de PAMM:
Home → PammInvestor → ManagerProfile → InvestPAMM → PammDashboard

## DATOS Y ESTADOS

### Estados globales necesarios:

#### AuthContext:
```javascript
{
  currentUser: FirebaseUser | null,
  userData: {
    uid: string,
    email: string,
    displayName: string,
    photoURL: string,
    verified: boolean,
    role: 'investor' | 'manager' | 'admin'
  },
  isAuthenticated: boolean,
  loading: boolean,
  login: (email, password) => Promise,
  register: (userData) => Promise,
  logout: () => Promise,
  refreshUserData: () => Promise
}
```

#### AccountsContext:
```javascript
{
  accounts: {
    'Cuentas Reales': Account[],
    'Cuentas Demo': Account[],
    'Copytrading': Account[],
    'Pamm': Account[]
  },
  selectedAccount: Account | null,
  activeCategory: string,
  isLoading: boolean,
  error: string | null,
  loadAccounts: () => Promise,
  selectAccount: (account) => void,
  updateAccount: (accountId, updates) => void,
  getTotalBalance: () => number
}
```

#### NotificationsContext:
```javascript
{
  notifications: Notification[],
  unreadCount: number,
  markAsRead: (notificationId) => void,
  markAllAsRead: () => void,
  addNotification: (notification) => void
}
```

### APIs y servicios:

#### Firebase Authentication:
- Método: Firebase Auth
- Funciones: login, register, resetPassword, signOut
- Respuesta: User object + Firestore user data

#### Trading Accounts Service:
- Endpoint: Firestore /users/{uid}/accounts
- Método: GET, POST, PUT, DELETE
- Parámetros: userId, accountType, filters
- Respuesta: Account[], balance, equity, profit/loss

#### Copytrading Service:
- Endpoint: API REST (disabled in current version)
- Métodos: followMaster, unfollowMaster, getMasterTraders
- Parámetros: masterUserId, followerAccountId, riskRatio
- Respuesta: Success/error, subscription data

#### PAMM Service:
- Endpoint: API REST
- Métodos: createPAMM, investPAMM, getPAMMManagers
- Parámetros: pammId, amount, managerId
- Respuesta: Investment data, performance stats

### Almacenamiento local (AsyncStorage):

#### User Preferences:
- Clave: 'userPreferences'
- Datos: language, theme, notifications settings
- Cuándo: Al cambiar configuración

#### Selected Account:
- Clave: 'selectedAccountId'
- Datos: accountId string
- Cuándo: Al seleccionar cuenta

#### Auth Token Cache:
- Clave: 'firebaseAuthToken'
- Datos: Firebase ID token
- Cuándo: Al autenticarse

## PROMPT PARA GENERAR EL PROYECTO REACT NATIVE

Usa este prompt exacto para generar el proyecto:

"Crea un proyecto React Native + Expo Go con la siguiente estructura:

**PÁGINAS A CREAR:**
- LoginScreen: Pantalla de autenticación con email/password y gradientes
- RegisterScreen: Registro de usuario completo con validación
- DashboardScreen: Pantalla principal con drawer navigation personalizado
- HomeScreen: Dashboard con balance, gráficos y accesos rápidos
- TradingAccountsScreen: Gestión de cuentas con tabs Real/Demo/Copytrading/PAMM
- WalletScreen: Billetera con depósitos/retiros/historial
- CertificatesScreen: Certificados con categorías y modal de detalles
- PipCalculatorScreen: Calculadora de pips para trading
- OperationsHistoryScreen: Historial de operaciones con filtros
- DownloadsScreen: Descargas de MT5 para diferentes plataformas
- AffiliatesScreen: Dashboard de afiliados con estadísticas
- NewsScreen: Noticias de mercado con búsqueda y categorías
- InvestorScreen: Copy trading vista inversor con lista de traders
- ManagerScreen: Copy trading vista gestor con estadísticas
- PammInvestorScreen: PAMM vista inversor con lista de managers
- SettingsScreen: Configuración de usuario y métodos de pago

**CONFIGURACIÓN:**
- Paleta de colores dark theme: #232323 (bg), #06b6d4 (primary), gradientes #0F7490 a #0A5A72
- Tipografía: Poppins con tamaños 12-36px y pesos 300-800
- Espaciados: 4-64px siguiendo diseño modular
- Navegación: Drawer principal + Stack auth + Modals

**COMPONENTES BASE:**
- Button: botón reutilizable con variantes y gradientes
- Input: input personalizado con validación y iconos
- Card: contenedor con gradientes y efectos
- Modal: modal base con animaciones
- DrawerContent: navegación lateral personalizada
- Charts: gráficos de rendimiento y balance

Genera la estructura completa de carpetas, archivos de navegación base, y páginas vacías pero ya estructuradas con sus estilos aplicados según la paleta de colores. Cada página debe tener su componente principal creado con imports correctos y estructura básica aplicada."

## CHECKLIST DE MIGRACIÓN

### Estructura del proyecto:
- [ ] Carpetas src/ creadas con subcarpetas
- [ ] Navegación configurada (Drawer + Stack + Modals)
- [ ] Estilos globales aplicados (colors.js, typography.js, spacing.js)
- [ ] Fuentes Poppins instaladas y configuradas
- [ ] Iconos y assets básicos añadidos

### Configuración base:
- [ ] Firebase configurado
- [ ] AsyncStorage configurado
- [ ] React Navigation instalado y configurado
- [ ] Contextos creados (Auth, Accounts, Notifications)
- [ ] Servicios base implementados
- [ ] Validaciones Zod configuradas

### Páginas principales:
- [ ] LoginScreen - Autenticación básica
- [ ] RegisterScreen - Registro completo
- [ ] HomeScreen - Dashboard principal
- [ ] TradingAccountsScreen - Gestión de cuentas
- [ ] WalletScreen - Billetera y transacciones
- [ ] CertificatesScreen - Certificados
- [ ] PipCalculatorScreen - Calculadora
- [ ] OperationsHistoryScreen - Historial
- [ ] DownloadsScreen - Descargas MT5
- [ ] AffiliatesScreen - Dashboard afiliados
- [ ] NewsScreen - Noticias
- [ ] SettingsScreen - Configuración

### Páginas CopyTrading:
- [ ] InvestorScreen - Vista inversor
- [ ] ManagerScreen - Vista gestor
- [ ] TraderProfileDetail - Perfil de trader

### Páginas PAMM:
- [ ] PammInvestorScreen - Inversor PAMM
- [ ] PammManagerScreen - Gestor PAMM
- [ ] PammAdminScreen - Admin PAMM

### Componentes reutilizables:
- [ ] Button component - Botón base
- [ ] Input component - Input con validación
- [ ] Card component - Tarjeta base
- [ ] Modal component - Modal base
- [ ] DrawerContent - Navegación lateral
- [ ] Charts components - Gráficos
- [ ] CustomDropdown - Dropdown personalizado
- [ ] LanguageSelector - Selector idioma

### Modals globales:
- [ ] LeaderboardModal - Ranking competiciones
- [ ] AccountSelectionModal - Selección de cuenta
- [ ] NotificationsModal - Centro notificaciones
- [ ] TraderProfileModal - Perfil trader copytrading

### Funcionalidades core:
- [ ] Autenticación Firebase integrada
- [ ] Estados globales funcionando
- [ ] Navegación entre pantallas
- [ ] Almacenamiento local configurado
- [ ] Servicios API conectados
- [ ] Validaciones de formularios
- [ ] Sistema de notificaciones
- [ ] Internacionalización (ES/EN)

### Integración de datos:
- [ ] Cuentas de trading conectadas
- [ ] Balance y equity mostrados
- [ ] Historial de operaciones
- [ ] Copytrading funcional
- [ ] PAMM básico funcionando
- [ ] Afiliados con estadísticas
- [ ] Métodos de pago configurados

### Testing y optimización:
- [ ] Testing en dispositivos físicos
- [ ] Performance optimizada
- [ ] Memoria y carga optimizada
- [ ] Navegación fluida
- [ ] Formularios responsive
- [ ] Errores manejados correctamente

### Deploy y distribución:
- [ ] Build de producción
- [ ] Assets optimizados
- [ ] Configuración ambiente prod
- [ ] Testing final en dispositivos
- [ ] Documentación actualizada

## NOTAS IMPORTANTES DE MIGRACIÓN

### Diferencias clave React → React Native:

1. **Componentes HTML → React Native:**
   - `<div>` → `<View>`
   - `<span>` → `<Text>`
   - `<button>` → `<TouchableOpacity>` + `<Text>`
   - `<input>` → `<TextInput>`
   - `<img>` → `<Image>`

2. **Estilos CSS → StyleSheet:**
   - Tailwind CSS → StyleSheet objects
   - Flexbox por defecto
   - No hay hover states (usar onPressIn/onPressOut)
   - Gradientes con react-native-linear-gradient

3. **Navegación:**
   - React Router → React Navigation
   - URLs → Screen names y params
   - Browser history → Navigation stack

4. **Assets:**
   - Imágenes públicas → require() o import
   - SVGs → react-native-svg
   - Fonts → registerFont + Platform

5. **Estado y storage:**
   - localStorage → AsyncStorage
   - sessionStorage → Memory state
   - Context API funciona igual

6. **Formularios:**
   - HTML forms → Custom validation
   - onChange → onChangeText
   - onSubmit → Button onPress

7. **Modales y overlays:**
   - CSS modals → react-native-modal
   - Z-index → Modal component
   - Backdrop → Overlay component

Esta migración mantiene toda la funcionalidad del proyecto original React web, adaptándola completamente a React Native con una experiencia de usuario nativa optimizada para móviles.