# 📚 GUÍA COMPLETA DE MIGRACIÓN: Firebase → Supabase

## 📋 Tabla de Contenidos
1. [Resumen](#resumen)
2. [Preparación](#preparación)
3. [Configuración de Supabase](#configuración-de-supabase)
4. [Migración del Código](#migración-del-código)
5. [Migración de Datos](#migración-de-datos)
6. [Testing](#testing)
7. [Despliegue](#despliegue)
8. [Rollback](#rollback)

---

## 🎯 Resumen

Esta guía documenta el proceso completo para migrar tu aplicación AGM Broker de Firebase a Supabase.

### Estado Actual
- **Base de datos**: Firebase Firestore
- **Autenticación**: Firebase Auth
- **Storage**: Firebase Storage
- **Functions**: Firebase Cloud Functions
- **Proyecto ID**: `ape-prop`

### Estado Objetivo
- **Base de datos**: Supabase PostgreSQL
- **Autenticación**: Supabase Auth
- **Storage**: Supabase Storage
- **Functions**: Supabase Edge Functions + Database Triggers
- **Proyecto URL**: `https://ukngiipxprielwdfuvln.supabase.co`

---

## 🚀 Preparación

### 1. Instalar Dependencias de Supabase

```bash
npm install @supabase/supabase-js
```

### 2. Verificar Variables de Entorno

El archivo `.env` ya contiene las variables necesarias:
- ✅ Variables de Firebase (para migración gradual)
- ✅ Variables de Supabase (nuevas)
- ✅ Variable `VITE_DATABASE_PROVIDER` para cambiar entre proveedores

### 3. Archivos Creados

Los siguientes archivos ya han sido creados para ti:

```
src/
├── supabase/
│   ├── config.js        # Configuración de Supabase
│   ├── auth.js          # Servicio de autenticación
│   └── storage.js       # Servicio de storage
├── services/
│   └── database.adapter.js  # Capa de abstracción
supabase/
└── migrations/
    └── 001_create_tables.sql  # Script de creación de tablas
```

---

## 🔧 Configuración de Supabase

### Paso 1: Ejecutar el Script de Migración

1. Abre el dashboard de Supabase: https://app.supabase.com
2. Selecciona tu proyecto: `ukngiipxprielwdfuvln`
3. Ve a **SQL Editor**
4. Copia y pega el contenido de `supabase/migrations/001_create_tables.sql`
5. Ejecuta el script

### Paso 2: Configurar Storage

1. En el dashboard, ve a **Storage**
2. El script automáticamente debería crear el bucket `profile-pictures`
3. Si no existe, créalo manualmente con:
   - Nombre: `profile-pictures`
   - Public: ✅ Sí
   - Allowed MIME types: `image/*`
   - Max file size: 5MB

### Paso 3: Configurar Email Templates

1. Ve a **Authentication** → **Email Templates**
2. Personaliza los templates según necesites:
   - Confirm signup
   - Reset password
   - Magic link

### Paso 4: Configurar Políticas de Seguridad

Las políticas RLS ya están incluidas en el script SQL, pero verifica en:
1. **Database** → **Tables**
2. Para cada tabla, revisa las políticas RLS
3. Asegúrate de que RLS esté habilitado

---

## 💻 Migración del Código

### Opción A: Migración Gradual (RECOMENDADO)

#### Fase 1: Usar el Adapter (Actual)

El código ya está preparado con un adapter que permite cambiar entre Firebase y Supabase:

```javascript
// En .env
VITE_DATABASE_PROVIDER=firebase  // Mantén Firebase por ahora
```

#### Fase 2: Actualizar Imports Gradualmente

1. **Buscar todos los imports de Firebase:**
```bash
grep -r "from '../firebase" src/ --include="*.js" --include="*.jsx"
```

2. **Reemplazar con el adapter:**

```javascript
// ANTES (Firebase directo)
import { loginUser } from '../firebase/auth';

// DESPUÉS (Con adapter)
import { AuthAdapter } from '../services/database.adapter';
// Usar: AuthAdapter.loginUser()
```

#### Fase 3: Cambiar a Supabase

Cuando todo esté usando el adapter:

```javascript
// En .env
VITE_DATABASE_PROVIDER=supabase  // Cambiar a Supabase
```

### Opción B: Migración Directa

Si prefieres migrar todo de una vez:

1. **Reemplazar imports en AuthContext:**

```javascript
// src/contexts/AuthContext.jsx
// ANTES
import { onAuthStateChange } from '../firebase/auth';
import { db, auth } from '../firebase/config';

// DESPUÉS
import { onAuthStateChange } from '../supabase/auth';
import { supabase } from '../supabase/config';
```

2. **Actualizar componentes uno por uno:**

Lista de archivos que necesitan actualización:
- `src/contexts/AuthContext.jsx`
- `src/components/Login.jsx`
- `src/components/Register.jsx`
- `src/components/ForgotPassword.jsx`
- `src/components/UserInformationContent.jsx`
- `src/components/TradingAccounts.jsx`
- `src/components/Wallet.jsx`
- `src/services/tradingAccounts.js`

---

## 📊 Migración de Datos

### Script de Exportación desde Firebase

Crea un archivo `scripts/export-firebase.js`:

```javascript
const admin = require('firebase-admin');
const fs = require('fs');

// Inicializar Firebase Admin
const serviceAccount = require('./path-to-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function exportData() {
  const collections = [
    'users',
    'trading_accounts',
    'transactions',
    'copy_relationships',
    'replication_queue',
    'userPreferences'
  ];

  const data = {};

  for (const collectionName of collections) {
    console.log(`Exportando ${collectionName}...`);
    const snapshot = await db.collection(collectionName).get();
    data[collectionName] = [];
    
    snapshot.forEach(doc => {
      data[collectionName].push({
        id: doc.id,
        ...doc.data()
      });
    });
  }

  fs.writeFileSync('firebase-export.json', JSON.stringify(data, null, 2));
  console.log('Exportación completada!');
}

exportData();
```

### Script de Importación a Supabase

Crea un archivo `scripts/import-supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  'https://ukngiipxprielwdfuvln.supabase.co',
  'YOUR_SERVICE_ROLE_KEY' // Usa service role key para bypass RLS
);

async function importData() {
  const data = JSON.parse(fs.readFileSync('firebase-export.json', 'utf8'));

  // 1. Importar usuarios
  console.log('Importando usuarios...');
  for (const user of data.users) {
    const { error } = await supabase
      .from('users')
      .upsert({
        ...user,
        created_time: user.created_time?.toDate?.() || user.created_time
      });
    
    if (error) console.error('Error importando usuario:', error);
  }

  // 2. Importar trading accounts
  console.log('Importando trading accounts...');
  for (const account of data.trading_accounts) {
    const { error } = await supabase
      .from('trading_accounts')
      .upsert({
        ...account,
        user_id: account.userId, // Mapear campo
        created_at: account.createdAt?.toDate?.() || account.createdAt
      });
    
    if (error) console.error('Error importando cuenta:', error);
  }

  // Continuar con otras colecciones...
  console.log('Importación completada!');
}

importData();
```

---

## 🧪 Testing

### 1. Testing Local

```bash
# Mantener Firebase
VITE_DATABASE_PROVIDER=firebase npm run dev

# Probar con Supabase
VITE_DATABASE_PROVIDER=supabase npm run dev
```

### 2. Checklist de Pruebas

#### Autenticación
- [ ] Registro de nuevo usuario
- [ ] Login con email
- [ ] Login con username
- [ ] Recuperación de contraseña
- [ ] Logout
- [ ] Persistencia de sesión

#### Base de Datos
- [ ] Crear cuenta de trading
- [ ] Ver listado de cuentas
- [ ] Actualizar balance
- [ ] Crear transacción
- [ ] Ver historial

#### Storage
- [ ] Subir foto de perfil
- [ ] Ver foto de perfil
- [ ] Eliminar foto de perfil

### 3. Testing Automatizado

```bash
npm run test
```

---

## 🚢 Despliegue

### Fase 1: Staging (Pruebas)

1. Deploy en ambiente de staging
2. Variable de entorno: `VITE_DATABASE_PROVIDER=supabase`
3. Probar con usuarios de prueba
4. Monitorear logs

### Fase 2: Producción Gradual

1. **Día 1**: 10% de usuarios en Supabase
2. **Día 3**: 50% de usuarios
3. **Día 5**: 100% de usuarios

### Fase 3: Cleanup

1. Desactivar Firebase
2. Remover código de Firebase
3. Remover dependencias de Firebase

```bash
npm uninstall firebase
```

---

## 🔄 Rollback

Si algo sale mal, puedes volver a Firebase inmediatamente:

### Rollback Rápido

```javascript
// .env
VITE_DATABASE_PROVIDER=firebase  // Volver a Firebase
```

### Rollback de Datos

Si necesitas restaurar datos:

1. Exporta los datos actuales de Supabase
2. Importa el backup de Firebase
3. Cambia la variable de entorno

---

## 📝 Notas Importantes

### Diferencias Clave

1. **IDs de Usuario**:
   - Firebase: `uid` (string)
   - Supabase: `id` (UUID)

2. **Timestamps**:
   - Firebase: `serverTimestamp()`
   - Supabase: `NOW()` en PostgreSQL

3. **Arrays**:
   - Firebase: `arrayUnion/arrayRemove`
   - Supabase: Operaciones JSONB

4. **Real-time**:
   - Firebase: `onSnapshot`
   - Supabase: `subscribe()` (no implementado aún)

### Consideraciones de Seguridad

1. **RLS (Row Level Security)**: Siempre activo en Supabase
2. **Service Role Key**: Solo para migraciones, nunca en frontend
3. **Anon Key**: Seguro para frontend

### Soporte

Si encuentras problemas:

1. Revisa los logs en Supabase Dashboard
2. Verifica las políticas RLS
3. Confirma que las variables de entorno están correctas
4. Revisa la consola del navegador para errores

---

## ✅ Checklist Final

Antes de considerar la migración completa:

- [ ] Todas las funcionalidades probadas
- [ ] Datos migrados correctamente
- [ ] Backup de Firebase guardado
- [ ] Monitoreo configurado
- [ ] Documentación actualizada
- [ ] Equipo informado
- [ ] Plan de rollback listo

---

## 🎉 ¡Migración Completada!

Una vez completados todos los pasos:

1. Celebra 🎉
2. Monitorea las métricas
3. Recopila feedback de usuarios
4. Optimiza según sea necesario

---

**Última actualización**: Enero 2025
**Versión**: 1.0.0
**Autor**: AGM Broker Team