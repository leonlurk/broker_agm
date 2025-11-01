# 🏗️ ARQUITECTURA COMPLETA DEL SISTEMA AGM BROKER

## 📋 ÍNDICE
1. [Visión General](#visión-general)
2. [Proyectos y Tecnologías](#proyectos-y-tecnologías)
3. [Flujo de Comunicación](#flujo-de-comunicación)
4. [Arquitectura Detallada](#arquitectura-detallada)
5. [Dominios y URLs](#dominios-y-urls)
6. [Sistemas de Base de Datos](#sistemas-de-base-de-datos)

---

## 🎯 VISIÓN GENERAL

Sistema completo de trading broker que integra MetaTrader 5 con funcionalidades de:
- **Gestión de Cuentas MT5** (real-time)
- **Copy Trading** (maestros y seguidores)
- **PAMM** (fondos de gestión)
- **Sistema de Afiliados**
- **KYC/Verificación de Usuarios**
- **CRM Administrativo**

---

## 📦 PROYECTOS Y TECNOLOGÍAS

### 1️⃣ **FRONTEND - Aplicación Cliente** 
📂 **Ruta:** `/home/rdpuser/Desktop/broker_agm`

**Stack Tecnológico:**
- React 19 + Vite
- Supabase (auth y datos)
- Firebase (auth secundario)
- React Router DOM
- Axios para HTTP
- Recharts para gráficos
- i18next (internacionalización ES/EN)

**Propósito:**
- Dashboard principal para traders/inversores
- Gestión de cuentas MT5
- Copy Trading (seguir maestros)
- PAMM (invertir en fondos)
- Sistema de afiliados
- KYC/Verificación
- Wallet/Transacciones

**Dominio Público:**
- En desarrollo: `http://localhost:5173`
- Producción: (por configurar con dominio)

**APIs que consume:**
```
VITE_API_BASE_URL=https://apekapital.com:444
VITE_TRADING_API_URL=https://apekapital.com:444
VITE_BROKER_API_URL=https://apekapital.com:444
```

---

### 2️⃣ **MAIN BACKEND - MT5 Manager API** 
📂 **Ruta:** `/home/rdpuser/Desktop/metatrader-api-v2`

**Stack Tecnológico:**
- Python 3.8+ + FastAPI
- MT5Manager API (nativo de MetaQuotes)
- Supabase (base de datos principal)
- Redis (caché y colas)
- Uvicorn (servidor ASGI)

**Propósito:**
- **Conexión directa con servidor MT5**
- Gestión de cuentas broker (crear, modificar, eliminar)
- Balance operations (depósitos, retiros, bonos)
- Sync worker (sincronización automática MT5 → Supabase)
- Endpoints optimizados para dashboard
- **Proxy hacia Copy-PAMM** (endpoints internos)

**Dominio Público:**
```
https://apekapital.com:444
```

**Endpoints Principales:**
```
GET  /api/health
POST /api/v1/auth/login
GET  /api/v1/accounts/{account_login}
GET  /api/v1/accounts/{account_login}/dashboard
GET  /api/v1/accounts/{account_login}/metrics
POST /api/v1/broker/accounts/create
POST /api/v1/broker/accounts/deposit
POST /api/v1/broker/accounts/withdraw
POST /api/v1/broker/accounts/bonus

# Proxy Copy-PAMM (frontend → main backend → copy-pamm)
GET  /api/v1/copy/masters
POST /api/v1/copy/follow
POST /api/v1/copy/unfollow
GET  /api/v1/pamm/funds
POST /api/v1/pamm/join
```

**Arquitectura Interna:**
```
/src/
  /application/api/          # Routers FastAPI
    - accounts.py            # Gestión cuentas
    - trading.py             # Trading operations
    - broker/accounts.py     # Broker management
    - proxy_copypamm.py      # 🔴 PROXY a copy-pamm
    - supabase_accounts.py   # Optimized queries
  /domain/                   # Modelos de negocio
  /infrastructure/
    - mt5_manager_service.py # MT5 Manager integration
    - supabase_client.py     # Supabase operations
```

---

### 3️⃣ **BACKEND SECUNDARIO - Copy-PAMM Logic** 
📂 **Ruta:** `/home/rdpuser/Desktop/copy-pamm`

**Stack Tecnológico:**
- Node.js + Express
- Supabase (base de datos)
- Redis + Bull/BullMQ (colas de trabajo)
- Pino (logging)

**Propósito:**
- **Lógica de negocio de Copy Trading**
- Detección de trades de maestros
- Replicación automática a seguidores
- Gestión de relaciones maestro-seguidor
- Sistema PAMM (fondos de inversión)
- Worker system (procesos en background)

**Dominio:**
```
INTERNO: http://localhost:8080
(NO tiene dominio público, solo accesible desde main backend)
```

**Endpoints:**
```
GET  /api/health
GET  /api/v1/copy/masters
POST /api/v1/copy/follow
POST /api/v1/copy/unfollow
GET  /api/v1/copy/subscriptions
GET  /api/v1/copy/followers
GET  /api/v1/copy/portfolio
POST /api/v1/copy/configure-master
GET  /api/v1/pamm/funds
POST /api/v1/pamm/join
POST /api/v1/pamm/leave
POST /api/v1/email/send
```

**Workers/Background Jobs:**
- `ReplicationDetector` - Detecta trades nuevos de maestros
- `WorkerManager` - Gestiona workers paralelos
- Colas Redis para procesamiento asíncrono

---

### 4️⃣ **MICROSERVICIO - MT5 Trade Service** 
📂 **Ruta:** `/home/rdpuser/Desktop/mt5-trade-service`

**Stack Tecnológico:**
- C# .NET 8.0
- MT5Manager API (nativo MetaQuotes)
- ASP.NET Core Minimal API

**Propósito:**
- **Ejecución directa de trades en MT5**
- Usado exclusivamente por Copy-PAMM backend
- Abre/cierra posiciones en cuentas follower
- Comunicación ultrarrápida con MT5

**Dominio:**
```
INTERNO: http://localhost:5555
(Solo accesible desde copy-pamm backend)
```

**Endpoints:**
```
GET  /health
POST /execute-trade       # Ejecutar trade
POST /close-position      # Cerrar posición
```

**Flujo de Uso:**
```
Copy-PAMM detecta trade maestro 
  → Llama a MT5 Trade Service 
  → Ejecuta en cuenta follower
```

---

### 5️⃣ **CRM BROKER - Panel Administrativo** 
📂 **Ruta:** `/home/rdpuser/Desktop/crm-agm-broker`

**Stack Tecnológico:**
- React 19 + TypeScript + Vite
- Clerk (autenticación admin)
- Supabase (base de datos)
- Radix UI + Tailwind CSS
- TanStack Query + Router
- Zustand (state management)

**Propósito:**
- **Panel administrativo del broker**
- Gestión de usuarios/clientes
- Aprobación de KYC
- Gestión de cuentas MT5
- Balance management (depósitos/retiros/bonos)
- Sistema de tareas internas
- Reportes y analíticas
- Gestión de PAMM/Copy Trading

**Dominio:**
```
En desarrollo: http://localhost:5173
(Separado del frontend cliente)
```

**Integración MT5:**
```typescript
// Se conecta a: https://apekapital.com:444
const MT5_BASE_URL = 'https://apekapital.com:444'
```

---

## 🔄 FLUJO DE COMUNICACIÓN

### **FLUJO 1: Usuario consulta balance/dashboard**
```
Frontend (broker_agm)
  ↓ GET https://apekapital.com:444/api/v1/accounts/{login}/dashboard
Main Backend (metatrader-api-v2)
  ↓ Query optimizada a Supabase + Cache Redis
Supabase Database
  ↓ Datos ya sincronizados por MT5SyncWorker
Response ← Frontend
```

### **FLUJO 2: Copy Trading - Seguir a un maestro**
```
Frontend (broker_agm)
  ↓ POST https://apekapital.com:444/api/v1/copy/follow
Main Backend (metatrader-api-v2)
  ↓ proxy_copypamm.py redirige →
Copy-PAMM Backend (localhost:8080)
  ↓ Guarda relación en Supabase
  ↓ ReplicationDetector empieza a monitorear
Response ← Main Backend ← Frontend
```

### **FLUJO 3: Copy Trading - Replicación automática**
```
Maestro opera en MT5
  ↓
MT5SyncWorker detecta nuevo trade
  ↓ Actualiza Supabase
Copy-PAMM ReplicationDetector
  ↓ Detecta trade nuevo (polling cada 5s)
  ↓ Calcula volumen proporcional
  ↓ POST http://localhost:5555/execute-trade
MT5 Trade Service (C#)
  ↓ Ejecuta en cuenta follower via MT5Manager
MT5 Server
  ✓ Trade replicado en follower
```

### **FLUJO 4: CRM crea cuenta MT5**
```
CRM (crm-agm-broker)
  ↓ POST https://apekapital.com:444/api/v1/broker/accounts/create
Main Backend (metatrader-api-v2)
  ↓ mt5_manager_service.py
  ↓ UserAdd() en MT5Manager API
MT5 Server
  ↓ Cuenta creada
  ↓ Guarda en Supabase
Response con login/password ← CRM
```

### **FLUJO 5: Sincronización automática MT5**
```
MT5SyncWorker (background process)
  ↓ Cada 30-60 segundos
  ↓ UserAccountRequest() para balance/equity
  ↓ DealRequestByLogins() para trades
MT5 Server
  ↓
Actualiza Supabase (broker_accounts, trading_operations)
  ↓
Frontend/CRM consultan datos ya sincronizados
```

---

## 🌐 DOMINIOS Y URLS

### **Producción:**
```
Frontend Cliente:        (por configurar dominio)
Main Backend MT5:        https://apekapital.com:444
Copy-PAMM Backend:       localhost:8080 (interno)
MT5 Trade Service:       localhost:5555 (interno)
CRM Broker:              (por configurar dominio)
```

### **Configuración de red:**
```
VPS → Main Backend (público en puerto 444 HTTPS)
VPS → Copy-PAMM (interno localhost:8080)
VPS → MT5 Trade Service (interno localhost:5555)
VPS → MT5 Server (conexión Manager API)
```

---

## 🗄️ SISTEMAS DE BASE DE DATOS

### **Supabase (Principal)**
```
URL: https://ukngiipxpprielwdfuvln.supabase.co

Tablas principales:
- profiles                 # Usuarios del sistema
- broker_accounts          # Cuentas MT5
- account_balance_history  # Historial de balances
- account_metrics          # Métricas calculadas
- trading_operations       # Trades/deals
- copy_relationships       # Relaciones maestro-seguidor
- pamm_funds              # Fondos PAMM
- pamm_investments        # Inversiones en fondos
- user_referrals          # Sistema de afiliados
- kyc_documents           # Verificación KYC
- wallet_transactions     # Transacciones wallet
```

### **Redis (Cache y Colas)**
```
Usado por:
- Main Backend: Cache de consultas optimizadas
- Copy-PAMM: Colas de trabajo (Bull/BullMQ)

Colas:
- replication_queue       # Trades a replicar
- detection_queue         # Detección de trades
```

### **Firebase (Auth secundario)**
```
Proyecto: ape-prop
Usado por: Frontend (broker_agm)
Rol: Autenticación de usuarios (alternativo a Supabase Auth)
```

---

## 🔑 DATOS CRÍTICOS

### **Variables de entorno críticas:**

**Main Backend (.env):**
```bash
# MT5 Manager
MT5_MANAGER_SERVER_HOST=your-server.com
MT5_MANAGER_SERVER_PORT=443
MT5_MANAGER_LOGIN=1000001
MT5_MANAGER_PASSWORD=***

# Supabase
SUPABASE_URL=https://ukngiipxpprielwdfuvln.supabase.co
SUPABASE_SERVICE_KEY=***

# Copy-PAMM
COPYPAMM_API_URL=http://localhost:8080/api/v1

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

**Copy-PAMM (.env):**
```bash
# Supabase
SUPABASE_URL=https://ukngiipxpprielwdfuvln.supabase.co
SUPABASE_KEY=***

# MT5 Trade Service
MT5_TRADE_SERVICE_URL=http://localhost:5555

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

**MT5 Trade Service (appsettings.Production.json):**
```json
{
  "MT5": {
    "Server": "your-server:443",
    "Login": 1008,
    "Password": "***"
  },
  "Service": {
    "Port": 5555,
    "Host": "localhost"
  }
}
```

---

## 📊 ARQUITECTURA VISUAL

```
┌─────────────────────────────────────────────────────────────┐
│                        INTERNET                              │
└───────────────────────┬─────────────────────────────────────┘
                        │
         ┌──────────────┴──────────────┐
         │                             │
    ┌────▼────┐                   ┌────▼────┐
    │ FRONTEND│                   │   CRM   │
    │ (React) │                   │ (React) │
    └────┬────┘                   └────┬────┘
         │                             │
         │ HTTPS                       │ HTTPS
         │ :444                        │ :444
         │                             │
    ┌────▼─────────────────────────────▼────┐
    │   MAIN BACKEND (MT5 Manager API)      │
    │   - FastAPI + Python                  │
    │   - Proxy Copy-PAMM                   │
    │   - MT5 Manager integration           │
    │   https://apekapital.com:444          │
    └────┬───────────────┬──────────────────┘
         │               │
         │ Internal      │ MT5Manager
         │ :8080         │ API
         │               │
    ┌────▼────┐     ┌────▼────┐
    │ COPY-   │     │   MT5   │
    │ PAMM    │────▶│ SERVER  │
    │ Backend │     │         │
    └────┬────┘     └─────────┘
         │
         │ :5555
         │
    ┌────▼────┐
    │  MT5    │
    │ Trade   │
    │ Service │
    │  (C#)   │
    └─────────┘
```

---

## 🎯 FLUJO DE DATOS RESUMIDO

1. **Frontend/CRM** → Llaman a **Main Backend** (público)
2. **Main Backend** → Conecta directamente con **MT5 Server** via Manager API
3. **Main Backend** → Hace proxy a **Copy-PAMM** (interno) para Copy Trading
4. **Copy-PAMM** → Llama a **MT5 Trade Service** (interno) para ejecutar trades
5. **MT5 Trade Service** → Ejecuta en **MT5 Server** via Manager API
6. **MT5SyncWorker** → Sincroniza datos **MT5 → Supabase** cada 30-60s
7. Todo usa **Supabase** como base de datos central

---

## ✅ ESTADO DEL SISTEMA

### Funcionalidades operativas:
- ✅ Gestión de cuentas MT5
- ✅ Balance operations (depósitos/retiros/bonos)
- ✅ Copy Trading (seguir maestros)
- ✅ Replicación automática de trades
- ✅ Sistema PAMM
- ✅ Sistema de afiliados
- ✅ KYC/Verificación
- ✅ CRM administrativo
- ✅ Dashboard real-time con equity

### Puntos de mejora conocidos:
- ⚠️ Copy-PAMM sin dominio público (solo interno)
- ⚠️ Configurar dominio para frontend
- ⚠️ Optimizar latencia en replicación (actualmente 5s polling)

---

**Última actualización:** 2025-10-31
**Versiones:**
- Frontend: 1.0.0
- Main Backend: 1.5.0
- Copy-PAMM: 2.0.0
- MT5 Trade Service: 1.0.0
- CRM: 1.4.2
