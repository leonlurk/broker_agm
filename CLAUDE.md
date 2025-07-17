# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

### Code Quality & Testing
- `npm run lint` - Run ESLint to check code quality
- `npm run test` - Run all tests with Vitest
- `npm run test:run` - Run tests once without watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ui` - Run tests with Vitest UI
- `npm run type:check` - Run TypeScript type checking (tsc --noEmit)

### Security & Maintenance
- `npm run audit` - Run npm audit to check for vulnerabilities
- `npm run audit:fix` - Automatically fix npm audit issues
- `npm run security:check` - Run high-level security audit
- `npm run build:analyze` - Build and analyze bundle size

## Project Architecture

### Tech Stack
- **Frontend**: React 19 with Vite
- **Routing**: React Router DOM 7.4
- **Styling**: Tailwind CSS with custom configuration
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **State Management**: React Context (AuthContext, AccountsContext, NotificationsContext)
- **UI Components**: Lucide React icons, React Hot Toast notifications
- **Data Validation**: Zod schemas
- **Charts**: Recharts library
- **Testing**: Vitest with React Testing Library

### Application Structure

#### Core Architecture
- **Single Page Application** with client-side routing
- **Protected routes** via authentication context
- **Modular dashboard** with sidebar navigation and dynamic content rendering
- **Context-based state management** for user data, accounts, and notifications

#### Main Application Flow
1. **App.jsx** - Root component handling routing and authentication state
2. **Dashboard.jsx** - Main dashboard container with sidebar and content switching
3. **Sidebar.jsx** - Navigation component with role-based menu items
4. **AuthContext** - Manages user authentication and Firestore user data synchronization

#### Key Components Organization
- **Authentication**: Login, Register, ForgotPassword, ResetPassword, VerificationCode
- **Trading Features**: TradingAccounts, TradingChallenge, PipCalculator, OperationsHistory
- **Portfolio Management**: Wallet, WithdrawComponent, PaymentMethodSettings
- **Copy Trading**: Inversor (investor view), Gestor (manager view), CopytradingDashboard
- **PAMM System**: PammDashboard, PammGestorAdminDashboard, PammManagerProfile
- **Content**: Home, Noticias, AfiliadosDashboard, CompetitionCards, CertificateComponent
- **Utilities**: ErrorBoundary, ScrollManager, CustomDropdown, CustomTooltip

#### Service Architecture
- **Firebase Services**: Authentication, Firestore database, Storage
- **API Services**: copytradingService.js, pammService.js, tradingAccounts.js
- **Configuration**: Centralized config in services/config.js
- **Logging**: Structured logging utility in utils/logger.js

### Environment Configuration

#### Required Environment Variables
The application requires a `.env` file with Firebase configuration:
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

### Security Considerations

#### Firebase Security
- User authentication via Firebase Auth with email/password
- Firestore security rules restrict data access to authenticated users only
- User data is stored in `/users/{userId}` documents with proper access controls

#### Code Security
- Input validation using Zod schemas (utils/validationSchemas.js)
- Environment variables for sensitive configuration
- Error boundaries for graceful error handling
- Structured logging without sensitive data exposure

### Navigation & State Management

#### Dashboard Navigation
The dashboard uses a state-based navigation system where:
- `selectedOption` determines which component renders in main content area
- Navigation parameters can be passed between components via `navigationParams`
- Modal overlays (like Leaderboard) don't change the underlying navigation state
- Settings view is handled separately from main navigation

#### Context Providers
- **AuthContext**: User authentication state and Firestore data
- **AccountsContext**: Trading account management
- **NotificationsContext**: Application notifications

### Development Guidelines

#### Component Architecture
- Components follow a modular structure with clear separation of concerns
- Dashboard components receive navigation callbacks for state management
- Modal components are rendered at the Dashboard level to avoid z-index issues
- Responsive design with mobile detection for sidebar behavior

#### Styling Patterns
- Tailwind CSS with dark theme as primary design
- Custom safelist configuration for dynamic classes
- Consistent color scheme using grays and blues
- Mobile-first responsive design principles

#### Testing Setup
- Vitest configured with jsdom environment
- React Testing Library for component testing
- Coverage reporting with detailed exclusions
- Test setup file in src/test/setup.js

## File Locations

- **Main Application**: src/App.jsx, src/Dashboard.jsx
- **Components**: src/components/ (organized by feature)
- **Contexts**: src/contexts/ (AuthContext, AccountsContext, NotificationsContext)
- **Firebase**: src/firebase/ (config.js, auth.js)
- **Services**: src/services/ (API integrations)
- **Utils**: src/utils/ (logging, validation, testing)
- **Configuration**: Root level config files (vite, tailwind, eslint, vitest)