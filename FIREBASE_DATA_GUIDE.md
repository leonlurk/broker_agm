# Firebase Data Architecture Guide for Claude Code

Esta guía documenta todas las colecciones de Firebase y estructuras de datos utilizadas en el proyecto AGM Broker. Claude Code debe seguir esta documentación para trabajar correctamente con los datos del proyecto.

## Configuración de Firebase

### Archivo de configuración
**Ubicación**: `src/firebase/config.js`

```javascript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
```

## Estructura de Colecciones de Firebase

### 1. Colección: `users`

**Propósito**: Almacena información de perfil de usuarios registrados
**Ubicación de uso principal**: `src/contexts/AuthContext.jsx`, `src/components/UserInformationContent.jsx`

#### Estructura del documento:
```javascript
{
  // Campos obligatorios del registro
  uid: string,                    // Firebase Auth UID (documento ID)
  username: string,               // Nombre de usuario único
  email: string,                  // Email del usuario
  display_name: string,           // Nombre para mostrar
  created_time: Timestamp,        // Momento de creación de cuenta
  user_type: "broker",           // Tipo de usuario (siempre "broker")
  
  // Campos de perfil del usuario (opcionales)
  nombre: string,                 // Nombre real del usuario
  apellido: string,               // Apellido del usuario
  pais: string,                   // País de residencia
  ciudad: string,                 // Ciudad de residencia
  phoneCode: string,              // Código de país del teléfono (ej: "+54")
  phoneNumber: string,            // Número de teléfono
  photoURL: string,               // URL de la foto de perfil
  fechaNacimiento: string,        // Fecha de nacimiento
  
  // Campos de sistema de referidos
  referralCount: number,          // Cantidad de referidos
  referredBy: string,             // ID del usuario que lo refirió (opcional)
  
  // Campos de métodos de pago
  paymentMethods: [               // Array de métodos de pago
    {
      id: string,                 // ID único del método
      type: string,               // Tipo: "bank", "crypto", "card"
      name: string,               // Nombre descriptivo
      details: object,            // Detalles específicos del método
      isDefault: boolean,         // Si es el método por defecto
      createdAt: Timestamp        // Fecha de creación
    }
  ]
}
```

#### Operaciones principales:
```javascript
// Crear/actualizar perfil de usuario
const userDocRef = doc(db, 'users', currentUser.uid);
await setDoc(userDocRef, userData, { merge: true });

// Leer datos del usuario
const userDocRef = doc(db, 'users', userId);
const userDocSnap = await getDoc(userDocRef);
if (userDocSnap.exists()) {
  const userData = userDocSnap.data();
}

// Buscar usuario por username
const usersQuery = query(
  collection(db, 'users'),
  where("username", "==", username)
);
const querySnapshot = await getDocs(usersQuery);
```

#### Componentes que usan esta colección:
- **AuthContext.jsx**: Sincronización automática de datos de usuario
- **UserInformationContent.jsx**: Formulario de perfil de usuario
- **Register.jsx**: Creación de usuarios nuevos
- **Login.jsx**: Verificación de existencia de usuario

---

### 2. Colección: `trading_accounts`

**Propósito**: Almacena las cuentas de trading de los usuarios
**Ubicación de uso principal**: `src/services/tradingAccounts.js`, `src/contexts/AccountsContext.jsx`

#### Estructura del documento:
```javascript
{
  // Información básica de la cuenta
  userId: string,                     // UID del usuario propietario
  accountNumber: string,              // Número de cuenta generado (timestamp + random)
  accountName: string,                // Nombre personalizado de la cuenta
  accountType: "DEMO" | "Real",       // Tipo de cuenta
  accountTypeSelection: string,       // "Zero Spread" o "Standard"
  leverage: string,                   // Apalancamiento (ej: "1:100")
  
  // Información financiera
  balance: number,                    // Saldo de la cuenta
  equity: number,                     // Equity de la cuenta
  margin: number,                     // Margen utilizado
  freeMargin: number,                 // Margen libre
  marginLevel: number,                // Nivel de margen (porcentaje)
  
  // Información técnica
  currency: "USD",                    // Moneda de la cuenta
  server: "AGM-Server",               // Servidor de trading
  platform: "MetaTrader 5",          // Plataforma de trading
  status: "Active",                   // Estado de la cuenta
  investorPassword: string,           // Contraseña de inversionista (opcional)
  
  // Timestamps
  createdAt: Timestamp,               // Fecha de creación
  updatedAt: Timestamp                // Última actualización
}
```

#### Operaciones principales:
```javascript
// Crear nueva cuenta de trading
const newAccount = {
  userId,
  accountNumber: generateAccountNumber(),
  accountName: accountData.accountName,
  accountType: accountData.accountType,
  // ... otros campos
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
};
const docRef = await addDoc(collection(db, 'trading_accounts'), newAccount);

// Obtener cuentas de un usuario
const accountsQuery = query(
  collection(db, 'trading_accounts'),
  where("userId", "==", userId)
);
const querySnapshot = await getDocs(accountsQuery);

// Actualizar balance de cuenta
const accountRef = doc(db, 'trading_accounts', accountId);
await updateDoc(accountRef, {
  balance: newBalance,
  equity: newBalance,
  freeMargin: newBalance,
  updatedAt: serverTimestamp()
});
```

#### Componentes que usan esta colección:
- **TradingAccounts.jsx**: Gestión de cuentas de trading
- **AccountsContext.jsx**: Contexto global de cuentas
- **Wallet.jsx**: Operaciones financieras con cuentas
- **tradingAccounts.js**: Servicio de cuentas de trading

---

### 3. Colección: `transactions`

**Propósito**: Registro de transacciones financieras (depósitos, retiros, transferencias)
**Ubicación de uso principal**: `src/components/Wallet.jsx`

#### Estructura del documento:
```javascript
{
  // Información básica de la transacción
  userId: string,                     // UID del usuario
  accountId: string,                  // ID de la cuenta de origen
  amount: number,                     // Monto de la transacción
  currency: "USD",                    // Moneda
  type: "depositar" | "retirar" | "transferir", // Tipo de transacción
  method: string,                     // Método usado (ej: "Criptomoneda", "Transferencia Bancaria")
  status: "pending" | "completed" | "rejected", // Estado de la transacción
  
  // Información específica según el tipo
  coin: string,                       // Tipo de criptomoneda (si aplica)
  walletAddress: string,              // Dirección de wallet (para retiros crypto)
  toAccountId: string,                // ID de cuenta destino (para transferencias)
  toAccountName: string,              // Nombre de cuenta destino (para transferencias)
  
  // Timestamps
  createdAt: Timestamp                // Fecha de creación
}
```

#### Operaciones principales:
```javascript
// Crear nueva transacción
const transactionData = {
  userId: currentUser.uid,
  accountId: selectedAccount.id,
  amount: parseFloat(amount),
  currency: 'USD',
  type: activeTab, // "depositar", "retirar", "transferir"
  method: selectedMethod,
  status: 'pending',
  createdAt: Timestamp.now()
};
await addDoc(collection(db, 'transactions'), transactionData);

// Consultar transacciones de un usuario
const transactionsQuery = query(
  collection(db, 'transactions'),
  where("userId", "==", userId),
  orderBy("createdAt", "desc")
);
const querySnapshot = await getDocs(transactionsQuery);
```

#### Componentes que usan esta colección:
- **Wallet.jsx**: Creación y visualización de transacciones

---

## Firebase Storage

### Estructura de almacenamiento:
```
/profile_pictures/{userId}/{timestamp}_{filename}
```

**Uso**: Almacenar fotos de perfil de usuarios

#### Operaciones principales:
```javascript
// Subir imagen de perfil
const fileName = `${Date.now()}_${profileImageFile.name}`;
const storageRef = ref(storage, `profile_pictures/${currentUser.uid}/${fileName}`);
await uploadBytes(storageRef, profileImageFile);
const downloadURL = await getDownloadURL(storageRef);
```

**Componente que usa Storage**:
- **UserInformationContent.jsx**: Subida de fotos de perfil

---

## Arquitectura de Servicios Externos

### PAMM y Copy Trading

**Importante**: Los componentes de PAMM y Copy Trading NO usan Firebase directamente. Están configurados para usar APIs HTTP externas:

#### Servicios configurados:
- **copytradingService.js**: API para copy trading
- **pammService.js**: API para fondos PAMM

#### Endpoints planeados:
```javascript
// Copy Trading
POST /copy/follow          // Seguir a un master trader
GET /copy/masters          // Obtener lista de masters
POST /copy/unfollow        // Dejar de seguir
PUT /copy/config           // Actualizar configuración
GET /copy/subscriptions    // Obtener suscripciones
GET /copy/followers        // Obtener seguidores

// PAMM
GET /pamm/funds           // Obtener fondos PAMM disponibles
POST /pamm/join           // Unirse a un fondo
POST /pamm/leave          // Salir de un fondo
GET /pamm/investments     // Obtener inversiones del usuario
```

---

## Patrones de Uso Recomendados para Claude Code

### 1. Autenticación y Usuarios
```javascript
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Obtener datos del usuario actual
const { currentUser, userData } = useAuth();

// Actualizar perfil de usuario
const updateUserProfile = async (profileData) => {
  const userDocRef = doc(db, 'users', currentUser.uid);
  await setDoc(userDocRef, profileData, { merge: true });
};
```

### 2. Cuentas de Trading
```javascript
import { getUserTradingAccounts, createTradingAccount } from '../services/tradingAccounts';

// Obtener cuentas del usuario
const accountsResult = await getUserTradingAccounts(userId);
if (accountsResult.success) {
  const accounts = accountsResult.accounts;
}

// Crear nueva cuenta
const newAccountResult = await createTradingAccount(userId, accountData);
```

### 3. Transacciones
```javascript
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

// Crear transacción
const transactionData = {
  userId: currentUser.uid,
  accountId: selectedAccount.id,
  amount: parseFloat(amount),
  type: "depositar",
  status: "pending",
  createdAt: Timestamp.now()
};
await addDoc(collection(db, 'transactions'), transactionData);
```

---

## Reglas de Seguridad de Firebase

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - solo el propietario puede leer/escribir
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Trading accounts - solo el propietario puede acceder
    match /trading_accounts/{accountId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Transactions - solo el propietario puede acceder
    match /transactions/{transactionId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

### Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Profile pictures - solo el propietario puede subir/leer
    match /profile_pictures/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## Consideraciones Importantes para Claude Code

1. **Autenticación requerida**: Todas las operaciones requieren usuario autenticado
2. **Contextos globales**: Usar AuthContext y AccountsContext para datos globales
3. **Manejo de errores**: Siempre verificar si los documentos existen antes de acceder a datos
4. **Timestamps**: Usar `serverTimestamp()` para timestamps consistentes
5. **Validación**: Validar datos antes de escribir a Firebase
6. **Optimización**: Usar consultas específicas con `where()` para filtrar datos
7. **Tiempo real**: Considerar `onSnapshot()` para datos que cambian frecuentemente

## Estructura de Directorios Relacionada

```
src/
├── firebase/
│   ├── config.js           # Configuración de Firebase
│   └── auth.js             # Funciones de autenticación
├── contexts/
│   ├── AuthContext.jsx     # Contexto de autenticación
│   ├── AccountsContext.jsx # Contexto de cuentas
│   └── NotificationsContext.jsx # Contexto de notificaciones
├── services/
│   ├── tradingAccounts.js  # Servicio de cuentas de trading
│   ├── copytradingService.js # Servicio de copy trading (API externa)
│   └── pammService.js      # Servicio de PAMM (API externa)
└── components/
    ├── UserInformationContent.jsx # Perfil de usuario
    ├── TradingAccounts.jsx        # Gestión de cuentas
    └── Wallet.jsx                 # Operaciones financieras
```

Esta guía debe ser tu referencia principal para trabajar con Firebase en el proyecto AGM Broker.