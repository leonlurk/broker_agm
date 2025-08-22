# 🏦 Broker Integration - Frontend Setup

## 🎯 Overview

Esta integración conecta el frontend React con la **API real de MT5Manager** en el backend Python, permitiendo la creación y gestión de cuentas reales de broker.

## ✅ Implementation Status

### ✅ Backend (Python API)
- **Real MT5Manager Integration**: ✅ Migrated from simulation to real implementation
- **Account Creation**: ✅ Uses actual `MT5Manager.UserAdd()`
- **Balance Operations**: ✅ Real deposits/withdrawals with `DealerBalance()`
- **Account Management**: ✅ Enable/disable, group management, live data
- **API Endpoints**: ✅ All 8 broker endpoints implemented

### ✅ Frontend (React)
- **Broker Accounts Service**: ✅ `brokerAccountsService.js` created
- **Account Creation Component**: ✅ `BrokerAccountCreation.jsx` implemented
- **Accounts View**: ✅ `BrokerAccountsView.jsx` with full UI
- **Context Integration**: ✅ `AccountsContext` supports broker + Firebase
- **Dashboard Integration**: ✅ Sidebar navigation and routing

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd metatrader-api-v2

# Configure environment
cp .env.example .env
# Edit .env with your MT5Manager credentials:
# MT5_MANAGER_SERVER_HOST=your-mt5-server.com
# MT5_MANAGER_SERVER_PORT=443
# MT5_MANAGER_LOGIN=1000001
# MT5_MANAGER_PASSWORD=your-password

# Test integration
python test_mt5_integration.py

# Start API server
python main.py
```

### 2. Frontend Setup
```bash
cd broker/broker_agm

# Configure environment
cp .env.example .env
# Edit .env with API URL:
# VITE_API_BASE_URL=http://localhost:8000

# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Usage
1. Navigate to **Sidebar → Broker**
2. Click **"Crear Cuenta Real"**
3. Fill in account details
4. Account is created directly in MT5 server
5. Account appears in the list with real MT5 credentials

## 🏗️ Architecture

### API Flow
```
Frontend React → brokerAccountsService.js → Python FastAPI → MT5Manager → MT5 Server
```

### Data Flow
```
1. User fills BrokerAccountCreation form
2. Data sent to /api/v1/broker/accounts/create
3. Backend creates real MT5 account
4. Response includes real MT5 login/passwords
5. Account added to AccountsContext
6. UI updates with new account
```

## 📁 Key Files

### Frontend
- `src/services/brokerAccountsService.js` - API service for broker operations
- `src/components/BrokerAccountCreation.jsx` - Account creation form
- `src/components/BrokerAccountsView.jsx` - Main broker accounts view
- `src/contexts/AccountsContext.jsx` - Updated for broker + Firebase
- `src/services/config.js` - Updated with broker API URL

### Backend
- `src/infrastructure/external/mt5_service.py` - **Real MT5Manager implementation**
- `src/application/services/broker_service.py` - Business logic layer
- `src/application/api/broker/accounts.py` - API endpoints
- `test_mt5_integration.py` - Integration test script

## 🔧 API Endpoints

### Account Management
```bash
# Create real broker account
POST /api/v1/broker/accounts/create
{
  "name": "John Doe",
  "email": "john@example.com",
  "country": "US",
  "account_type": "standard",
  "leverage": 100,
  "initial_deposit": 1000
}

# Get account details
GET /api/v1/broker/accounts/{account_login}/info

# List user accounts
GET /api/v1/broker/accounts/user/{user_id}

# Deposit funds
POST /api/v1/broker/accounts/{account_login}/deposit
{
  "amount": 500.00,
  "reference": "DEP-123",
  "method": "manual"
}

# Withdraw funds
POST /api/v1/broker/accounts/{account_login}/withdraw
{
  "amount": 200.00,
  "reference": "WTH-456",
  "method": "manual"
}
```

## 🎮 Frontend Components

### BrokerAccountCreation
- **Form validation** with real-time feedback
- **MT5 constraints** (password requirements, groups, leverage)
- **API integration** with loading states and error handling
- **Success feedback** showing MT5 credentials

### BrokerAccountsView
- **Accounts listing** with real MT5 data
- **Account status** (Active/Inactive)
- **Balance information** (real-time from MT5)
- **Action buttons** (Deposit, Withdraw, Details)

### AccountsContext Integration
- **Dual data sources**: Firebase (DEMO) + Broker API (REAL)
- **API status checking** with fallback to Firebase
- **Account categorization** by type
- **Real-time updates** after operations

## 🔒 Security Features

### Frontend
- **Input validation** prevents injection attacks
- **API timeout** handling (30 seconds)
- **Error boundaries** for graceful failures
- **Secure credential display** (masked passwords)

### Backend
- **MT5 server authentication** via Manager API
- **Request validation** using Pydantic models
- **Transaction logging** for audit trails
- **Circuit breaker** pattern for MT5 connection

## 🚨 Error Handling

### Common Errors & Solutions

**Frontend Errors:**
```javascript
// Network Error
"Network error: Unable to connect to broker API"
// Solution: Check API server is running

// Validation Error  
"Invalid data: Missing required fields: name, email"
// Solution: Fill all required fields

// API Error
"Server error: MT5 Manager not connected"
// Solution: Check MT5 server connection in backend
```

**Backend Errors:**
```python
# MT5Manager Import Error
"MT5Manager library not available"
# Solution: Install MT5Manager from MetaQuotes

# Connection Error
"Failed to connect to MT5 server"
# Solution: Verify server credentials in .env

# Account Creation Error
"UserAdd returned invalid login"
# Solution: Check group exists and user permissions
```

## 📊 Testing

### Manual Testing Checklist
- [ ] Backend API server starts successfully
- [ ] MT5 integration test passes
- [ ] Frontend connects to API
- [ ] Account creation form validates input
- [ ] Real MT5 account is created
- [ ] Account appears in list
- [ ] Deposit/withdrawal operations work
- [ ] Error handling displays correctly

### Test Commands
```bash
# Backend integration test
cd metatrader-api-v2
python test_mt5_integration.py

# Frontend development
cd broker/broker_agm
npm run dev

# Test API endpoint
curl -X POST http://localhost:8000/api/v1/broker/accounts/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@agm.com",
    "country": "US",
    "account_type": "standard",
    "leverage": 100,
    "initial_deposit": 1000
  }'
```

## 🎉 Success Indicators

When everything is working correctly, you should see:

1. **Backend logs**: "Real MT5 trading account created successfully"
2. **Frontend success**: Account creation dialog with MT5 credentials
3. **Account list**: New account appears with real balance
4. **MT5 verification**: Account accessible via MT5 terminal

## 🔄 Next Steps

1. **Production deployment** with real MT5 server
2. **Advanced features**: Position management, trading history
3. **Mobile optimization** for responsive design
4. **Real-time updates** via WebSocket integration
5. **Audit logging** for compliance requirements

## 📞 Support

- **Backend issues**: Check MT5Manager integration and server connection
- **Frontend issues**: Verify API URL and network connectivity  
- **Integration issues**: Run test scripts and check logs

---

**🎯 Priority: Account Creation is now FULLY FUNCTIONAL with real MT5Manager integration!**