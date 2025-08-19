# Componentes por Sección

Este documento mapea cada archivo de `src/components` a su sección correspondiente en la aplicación.

## Autenticación
- `Login.jsx` - Componente de inicio de sesión
- `Register.jsx` - Componente de registro de usuario
- `ForgotPassword.jsx` - Recuperación de contraseña
- `ResetPassword.jsx` - Restablecimiento de contraseña
- `VerificationCode.jsx` - Verificación de código
- `KYCVerification.jsx` - Verificación KYC (Know Your Customer)

## Panel Principal y Navegación
- `Dashboard.jsx` - Contenedor principal del dashboard con sidebar y navegación
- `Home.jsx` - Página de inicio del dashboard
- `Settings.jsx` - Configuraciones de usuario
- `UserInformationContent.jsx` - Información detallada del usuario

## Cuentas de Trading
- `TradingAccounts.jsx` - Gestión de cuentas de trading
- `TradingChallenge.jsx` - Desafíos de trading
- `TradingDashboard.jsx` - Dashboard específico de trading
- `AccountSelectionModal.jsx` - Modal para selección de cuentas
- `OperationsHistory.jsx` - Historial de operaciones

## Herramientas de Trading
- `PipCalculator.jsx` - Calculadora de pips

## Gestión de Cartera y Pagos
- `Wallet.jsx` - Billetera del usuario
- `WithdrawComponent.jsx` - Componente de retiros
- `WithdrawalHistoryDetails.jsx` - Detalles del historial de retiros
- `PaymentMethodSettings.jsx` - Configuración de métodos de pago

## Copy Trading
- `CopytradingDashboard.jsx` - Dashboard principal de copy trading
- `Inversor.jsx` - Vista del inversor en copy trading
- `Gestor.jsx` - Vista del gestor en copy trading
- `CopiarEstrategiaModal.jsx` - Modal para copiar estrategias
- `ConfigurarGestorModal.jsx` - Modal de configuración de gestor
- `SeguirTraderModal.jsx` - Modal para seguir traders
- `TraderProfileDetail.jsx` - Detalle del perfil de trader
- `LeaderboardModal.jsx` - Modal del ranking de traders

## Sistema PAMM
- `PammDashboard.jsx` - Dashboard principal de PAMM
- `PammGestorAdminDashboard.jsx` - Dashboard administrativo del gestor PAMM
- `PammManagerProfile.jsx` - Perfil del manager PAMM
- `CrearPAMMModal.jsx` - Modal para crear cuenta PAMM
- `InvertirPAMMModal.jsx` - Modal para invertir en PAMM

### Componentes del Perfil de Manager PAMM
- `pamm-manager-profile-components/`
  - `HeroSection.jsx` - Sección hero del perfil
  - `ManagerInfo.jsx` - Información del manager
  - `Summary.jsx` - Resumen de rendimiento
  - `PerformanceCharts.jsx` - Gráficos de rendimiento
  - `RecentTrades.jsx` - Operaciones recientes
  - `Subscriptions.jsx` - Suscripciones
  - `Faqs.jsx` - Preguntas frecuentes

## Contenido y Noticias
- `Noticias.jsx` - Sección de noticias
- `Noticias2.jsx` - Sección alternativa de noticias
- `CertificateComponent.jsx` - Componente de certificados
- `Descargas.jsx` - Sección de descargas

## Afiliados y Competiciones
- `AfiliadosDashboard.jsx` - Dashboard de afiliados
- `CompetitionCards.jsx` - Tarjetas de competiciones

## Modales y Notificaciones
- `NotificationsModal.jsx` - Modal de notificaciones
- `CommentsRatingModal.jsx` - Modal de comentarios y calificaciones

## Utilidades y Componentes Base
- `ErrorBoundary.jsx` - Manejo de errores de React
- `LanguageSelector.jsx` - Selector de idioma

### Utilidades (utils/)
- `CustomDropdown.jsx` - Dropdown personalizado
- `CustomTooltip.jsx` - Tooltip personalizado
- `Pagination.jsx` - Componente de paginación
- `ScrollManager.jsx` - Gestor de scroll

## Organización por Funcionalidad

### Trading y Operaciones
- TradingAccounts, TradingChallenge, TradingDashboard, OperationsHistory, PipCalculator

### Copy Trading
- CopytradingDashboard, Inversor, Gestor, y todos los modales relacionados

### PAMM
- Todos los componentes PammDashboard, PammGestorAdminDashboard, PammManagerProfile y la carpeta pamm-manager-profile-components/

### Gestión Financiera
- Wallet, WithdrawComponent, PaymentMethodSettings, WithdrawalHistoryDetails

### Autenticación y Verificación
- Login, Register, ForgotPassword, ResetPassword, VerificationCode, KYCVerification

### Contenido y Marketing
- Home, Noticias, AfiliadosDashboard, CompetitionCards, CertificateComponent, Descargas