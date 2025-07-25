# 🔒 Guía de Configuración de Seguridad - AGM Broker

## 🚨 CONFIGURACIÓN CRÍTICA REQUERIDA

**IMPORTANTE**: Esta aplicación financiera requiere configuración de seguridad antes de ejecutarse en producción.

## 📋 Variables de Entorno Requeridas

### 1. Crear archivo `.env` en la raíz del proyecto

Copia el archivo `.env.example` y renómbralo a `.env`:

```bash
cp .env.example .env
```

### 2. Configurar Variables de Firebase (REQUERIDAS)

```env
# Firebase Configuration - REEMPLAZAR CON TUS VALORES REALES
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto-id
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123def456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 3. Configurar Variables de Aplicación

```env
# Application Configuration
VITE_APP_ENV=production
VITE_APP_NAME=AGM Broker
VITE_APP_VERSION=1.0.0

# API Configuration
VITE_API_BASE_URL=https://api.tudominio.com
VITE_TRADING_API_URL=https://trading-api.tudominio.com

# Security & Features
VITE_ENABLE_LOGGING=false
VITE_ENABLE_ANALYTICS=true
```

## 🔐 Configuración de Firebase

### 1. Crear Proyecto Firebase
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto
3. Habilita Authentication (Email/Password)
4. Habilita Firestore Database

### 2. Configurar Reglas de Seguridad Firestore

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - solo el usuario puede acceder a sus datos
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 🧪 Testing

### Ejecutar Tests
```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests con coverage
npm run test:coverage
```

## 📦 Instalación y Ejecución

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
```bash
# Copiar y editar .env
cp .env.example .env
# Editar .env con tus valores reales
```

### 3. Ejecutar en desarrollo
```bash
npm run dev
```

### 4. Build para producción
```bash
npm run build
```

## ⚠️ Checklist de Seguridad Pre-Producción

- [ ] ✅ Variables de entorno configuradas
- [ ] ✅ Firebase reglas de seguridad implementadas
- [ ] ✅ Headers de seguridad configurados
- [ ] ✅ Validación de entrada implementada
- [ ] ✅ Logging seguro configurado
- [ ] ✅ Error boundaries implementados
- [ ] ✅ Tests de seguridad pasando
- [ ] ✅ HTTPS configurado en producción

---

**IMPORTANTE**: Nunca commitear el archivo `.env` al repositorio.
 