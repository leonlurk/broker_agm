# PAMM Investment Balance Integration Task

## Overview
This document provides complete context for implementing the missing balance deduction functionality in the PAMM (Percentage Allocation Management Module) investment flow. Currently, when users invest in a PAMM fund, the investment is recorded in the database but **NO actual balance is deducted** from their MT5 trading account.

## Project Architecture

### Multi-Repository Structure

This project consists of multiple interconnected repositories:

1. **broker_agm** (`/home/rdpuser/Desktop/broker_agm`)
   - React frontend application
   - Main user interface for the broker platform
   - Contains Wallet, PAMM Dashboard, CopyTrading features
   - Uses Vite as build tool

2. **copy-pamm** (`/home/rdpuser/Desktop/copy-pamm`)
   - Node.js/Express backend (FastAPI-like structure)
   - Handles PAMM and CopyTrading business logic
   - Connects to Supabase for database operations
   - Port: Usually 3001 or 3002

3. **metatrader-api-v2** (`/home/rdpuser/Desktop/metatrader-api-v2`)
   - Python FastAPI application
   - Direct integration with MetaTrader 5 servers
   - Provides REST API for MT5 operations
   - Contains account management, trading, synchronization

4. **Supabase** (Database)
   - PostgreSQL database with real-time subscriptions
   - Authentication provider
   - RPC functions for transactions
   - Tables: `pamm_funds`, `pamm_investors`, `internal_transfers`, `deposits`, `withdrawals`, etc.

### Architecture Flow

```
User Browser (broker_agm)
    ↓
    ↓ (API calls via pammService.js)
    ↓
copy-pamm Backend (Node.js/Express)
    ↓
    ↓ (Supabase Admin Client)
    ↓
Supabase Database ← → metatrader-api-v2 (Python FastAPI)
                         ↓
                         ↓ (MT5 Manager API / Trading API)
                         ↓
                    MetaTrader 5 Servers
```

## Current Implementation

### Frontend: Investment Initiation

**File:** `/home/rdpuser/Desktop/broker_agm/src/components/PammDashboard.jsx`

The main PAMM dashboard component that handles:
- Displaying available PAMM funds
- Investment modal trigger
- Fund exploration and details

**File:** `/home/rdpuser/Desktop/broker_agm/src/components/InvertirPAMMModal.jsx`

Investment modal that:
- Collects investment amount
- Selects MT5 account to invest from
- Validates input
- Calls `onConfirm` prop with investment data

**File:** `/home/rdpuser/Desktop/broker_agm/src/services/pammService.js`

Service layer that makes API calls:

```javascript
export const joinPammFund = async (fundId, mt5AccountId, investedAmount) => {
    const response = await logicApiClient.post('/api/v1/pamm/join', {
        fund_id: fundId,
        investor_mt5_account_id: mt5AccountId,
        invested_amount: investedAmount
    });
    return response.data;
};
```

- **API Client:** `logicApiClient` is configured in the same file
- **Endpoint:** POST to copy-pamm backend at `/api/v1/pamm/join`

### Backend: Investment Processing

**File:** `/home/rdpuser/Desktop/copy-pamm/src/api/controllers/pammControllerSupabase.js`

Method: `async joinPool(req, res)` (starts at line 152)

**Current Flow:**
1. ✅ Extract parameters: `fund_id`, `investor_mt5_account_id`, `invested_amount`
2. ✅ Validate parameters exist and amount > 0
3. ✅ Verify fund exists and is active (query `pamm_funds` table)
4. ✅ Check minimum investment requirement
5. ✅ Check for duplicate active investments
6. ❌ **MISSING: Verify account balance**
7. ❌ **MISSING: Deduct balance from investor account**
8. ✅ Insert record into `pamm_investors` table
9. ✅ Return success response

**TODO Comment Location:** Lines 216-226 explain what's missing

### Database Schema

**Table: `pamm_funds`**
Located in: `/home/rdpuser/Desktop/copy-pamm/supabase/migrations/003_copy_pamm_tables.sql`

```sql
CREATE TABLE public.pamm_funds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  manager_id UUID NOT NULL REFERENCES auth.users(id),
  manager_mt5_account_id TEXT NOT NULL,  -- ← Manager's MT5 account
  min_investment DECIMAL(10,2) DEFAULT 100.00,
  max_investment DECIMAL(10,2),
  current_aum DECIMAL(15,2) DEFAULT 0.00,  -- ← Should be updated
  performance_fee DECIMAL(3,2),
  management_fee DECIMAL(3,2),
  status TEXT CHECK (status IN ('active', 'inactive', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Table: `pamm_investors`**

```sql
CREATE TABLE public.pamm_investors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fund_id UUID NOT NULL REFERENCES pamm_funds(id),
  investor_id UUID NOT NULL REFERENCES auth.users(id),
  investor_mt5_account_id TEXT NOT NULL,  -- ← Investor's account
  invested_amount DECIMAL(15,2) NOT NULL,
  current_value DECIMAL(15,2) NOT NULL,
  profit_loss DECIMAL(15,2) DEFAULT 0,
  status TEXT CHECK (status IN ('active', 'pending', 'withdrawn')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Table: `internal_transfers`** (for virtual balance tracking)

This table is used by the Wallet feature for internal transfers between accounts.

**File:** Check Supabase migrations for schema
**RPC Function:** `create_transfer_request` exists in Supabase

## Existing Transfer System

### How Wallet Transfers Work

**File:** `/home/rdpuser/Desktop/broker_agm/src/services/transactionService.js`

The platform ALREADY has a working internal transfer system:

```javascript
async createTransferRequest(transferData) {
    const { data, error } = await supabase.rpc('create_transfer_request', {
        p_amount: transferData.amount,
        p_from_account_id: transferData.from_account_id,
        p_from_account_name: transferData.from_account_name,
        p_to_account_id: transferData.to_account_id,
        p_to_account_name: transferData.to_account_name
    });

    return { success, transferId, data };
}
```

**This can be reused for PAMM investments!**

### Supabase RPC Function

The `create_transfer_request` RPC function:
- Creates a record in `internal_transfers` table
- Validates account ownership
- May trigger balance updates (check the function definition in Supabase)
- Returns transfer ID and status

**To inspect:** Connect to Supabase dashboard and check the function definition in SQL Editor

## MetaTrader API Integration

### Available MT5 API

**Repository:** `/home/rdpuser/Desktop/metatrader-api-v2`

**File:** `/home/rdpuser/Desktop/metatrader-api-v2/src/application/api/accounts.py`

This file contains account management endpoints. Check for:
- Balance retrieval methods
- Account information endpoints
- Any balance adjustment methods (if they exist)

**File:** `/home/rdpuser/Desktop/metatrader-api-v2/src/infrastructure/external/mt5_service.py`

Low-level MT5 service that:
- Connects to MT5 Manager API
- May have balance operation methods
- Handles trade operations

**Search Terms:**
- "balance"
- "deposit"
- "withdraw"
- "credit"
- "transfer"

### MT5 Balance Operations

In MetaTrader 5, balance changes typically happen through:

1. **Deposit/Withdrawal Operations** - External money in/out
2. **Credit Operations** - Temporary credit given by broker
3. **Internal Transfers** - Moving money between accounts (if supported)
4. **Trade P&L** - Profit/loss from closed trades

For PAMM investments, you likely need either:
- **Internal transfer** from investor account to manager account
- **Credit operation** to reduce investor balance and increase manager balance
- **Virtual tracking** with periodic synchronization

### Checking MT5 API Capabilities

**Step 1:** Examine metatrader-api-v2 endpoints

```bash
cd /home/rdpuser/Desktop/metatrader-api-v2
grep -r "balance\|deposit\|withdraw\|credit\|transfer" src/application/api/ --include="*.py"
```

**Step 2:** Check MT5 service methods

```bash
grep -r "def.*balance\|def.*deposit\|def.*transfer" src/infrastructure/external/mt5_service.py
```

**Step 3:** Look for existing balance modification code

```bash
grep -r "balance.*=" src/ --include="*.py" -A 5 -B 5
```

## Implementation Options

### Option 1: Virtual Transfer with Supabase RPC (Recommended for MVP)

**Pros:**
- Uses existing `internal_transfers` system
- No MT5 Manager API required
- Fast to implement
- Provides audit trail

**Cons:**
- Balance change is only virtual in database
- MT5 doesn't reflect the transfer (accounts still show full balance)
- Requires periodic sync or manual intervention

**Implementation Steps:**

1. **Import transactionService in copy-pamm**
   - Install Supabase client if not present
   - Use the same RPC function the frontend uses

2. **Modify `joinPool` in pammControllerSupabase.js:**

```javascript
// After validating fund and investment amount...

// Step 1: Get fund manager's account
const { data: fund, error: fundError } = await supabaseAdmin
    .from('pamm_funds')
    .select('id, name, manager_mt5_account_id, current_aum')
    .eq('id', fund_id)
    .single();

// Step 2: Verify investor account balance (query from MT5 API or Supabase cache)
// TODO: Call metatrader-api-v2 to get account balance
const investorBalance = await getAccountBalance(investor_mt5_account_id);
if (investorBalance < invested_amount) {
    return res.status(400).json({
        error: `Saldo insuficiente. Balance disponible: $${investorBalance}`
    });
}

// Step 3: Create internal transfer
const { data: transfer, error: transferError } = await supabaseAdmin
    .rpc('create_transfer_request', {
        p_amount: invested_amount,
        p_from_account_id: investor_mt5_account_id,
        p_from_account_name: `Account ${investor_mt5_account_id}`,
        p_to_account_id: fund.manager_mt5_account_id,
        p_to_account_name: `PAMM Fund: ${fund.name}`
    });

if (transferError || !transfer.success) {
    return res.status(500).json({
        error: 'Error al transferir fondos'
    });
}

// Step 4: Create investment record (existing code)
const { data, error } = await supabaseAdmin
    .from('pamm_investors')
    .insert({
        fund_id: fund_id,
        investor_id: investorId,
        investor_mt5_account_id: investor_mt5_account_id,
        invested_amount: invested_amount,
        current_value: invested_amount,
        profit_loss: 0,
        status: 'active',
        joined_at: new Date().toISOString(),
        transfer_id: transfer.transfer_id  // Link to transfer
    })
    .select()
    .single();

// Step 5: Update fund AUM
await supabaseAdmin
    .from('pamm_funds')
    .update({
        current_aum: fund.current_aum + invested_amount,
        updated_at: new Date().toISOString()
    })
    .eq('id', fund_id);
```

3. **Add transfer_id column to pamm_investors:**

```sql
ALTER TABLE pamm_investors
ADD COLUMN transfer_id UUID REFERENCES internal_transfers(id);
```

### Option 2: Direct MT5 Balance Operation (Production Solution)

**Pros:**
- Real balance changes in MT5
- No synchronization issues
- Accurate account statements

**Cons:**
- Requires MT5 Manager API access
- More complex implementation
- May need broker permissions

**Implementation Steps:**

1. **Check if MT5 API supports balance operations:**

Navigate to metatrader-api-v2 and search for balance modification methods.

2. **Create new endpoint in metatrader-api-v2** (if needed):

**File:** `/home/rdpuser/Desktop/metatrader-api-v2/src/application/api/accounts.py`

```python
@router.post("/accounts/{login}/transfer")
async def create_internal_transfer(
    login: int,
    transfer_data: TransferRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Transfer balance from one account to another
    """
    # Validate accounts exist
    # Call MT5 Manager API to perform credit/debit operations
    # Return transaction details
```

3. **Call MT5 API from copy-pamm:**

```javascript
// In joinPool method, after validation:

// Call metatrader-api-v2 to perform transfer
const mt5Response = await axios.post(
    `${MT5_API_URL}/accounts/${investor_mt5_account_id}/transfer`,
    {
        to_account: fund.manager_mt5_account_id,
        amount: invested_amount,
        comment: `PAMM Investment - Fund: ${fund.name}`
    },
    {
        headers: {
            'Authorization': `Bearer ${MT5_API_TOKEN}`
        }
    }
);

if (!mt5Response.data.success) {
    return res.status(500).json({
        error: 'Error al transferir fondos en MT5'
    });
}

// Continue with investment record creation...
```

### Option 3: Hybrid Approach

1. Create virtual transfer record in Supabase (for immediate feedback)
2. Queue MT5 operation for background processing
3. Update records after MT5 confirms operation

## Investigation Checklist

Before implementing, you MUST investigate:

### 1. Database Schema

- [ ] Inspect `create_transfer_request` RPC function in Supabase
- [ ] Check `internal_transfers` table schema
- [ ] Verify if `pamm_investors` needs `transfer_id` column
- [ ] Check if there are any triggers or policies affecting transfers

**How to check:**
```sql
-- In Supabase SQL Editor:
SELECT routine_definition
FROM information_schema.routines
WHERE routine_name = 'create_transfer_request';

-- Check internal_transfers schema:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'internal_transfers';
```

### 2. MetaTrader API Capabilities

- [ ] Check if metatrader-api-v2 has balance operation endpoints
- [ ] Determine if MT5 Manager API access is available
- [ ] Check authentication method for MT5 API
- [ ] Find MT5 API base URL and configuration

**Files to examine:**
- `/home/rdpuser/Desktop/metatrader-api-v2/src/application/api/accounts.py`
- `/home/rdpuser/Desktop/metatrader-api-v2/src/infrastructure/external/mt5_service.py`
- `/home/rdpuser/Desktop/metatrader-api-v2/src/config/` (look for API URLs)

### 3. Existing Transfer Implementation

- [ ] Read the complete `transactionService.js` to understand the flow
- [ ] Check if Wallet transfers actually modify MT5 balances or just database
- [ ] Test a wallet transfer and verify behavior
- [ ] Check backend logs when transfer is created

**How to test:**
1. Use the Wallet feature in broker_agm
2. Create an internal transfer between accounts
3. Check if account balance changes in MT5 or only in UI
4. Look at `internal_transfers` table to see the record

### 4. Account Balance Retrieval

- [ ] Find how current implementation gets account balances
- [ ] Check if balances are cached in Supabase or fetched real-time from MT5
- [ ] Determine refresh frequency of balance data

**Files to check:**
- `/home/rdpuser/Desktop/broker_agm/src/services/mt5Api.js`
- Look for `getAccounts()` or `getAccountBalance()` methods

### 5. Error Handling & Rollback

- [ ] Understand transaction handling in current code
- [ ] Determine rollback strategy if investment creation fails after transfer
- [ ] Check if Supabase has transaction support for this use case

## Testing Strategy

### Before Implementation

1. **Test Current Behavior:**
   - Invest in a PAMM fund
   - Check `pamm_investors` table - record should be created
   - Check investor MT5 account balance - should NOT change
   - Check fund's `current_aum` - verify if it updates

2. **Test Wallet Transfers:**
   - Create internal transfer in Wallet
   - Monitor database changes
   - Check if MT5 balances change

### After Implementation

1. **Positive Test Cases:**
   - [ ] Invest with sufficient balance → should succeed
   - [ ] Verify balance deducted from investor account
   - [ ] Verify balance added to manager account (or fund account)
   - [ ] Verify investment record created
   - [ ] Verify fund AUM updated
   - [ ] Verify transfer record created (if using Option 1)

2. **Negative Test Cases:**
   - [ ] Invest with insufficient balance → should fail with clear error
   - [ ] Invest in inactive fund → should fail
   - [ ] Invest below minimum amount → should fail
   - [ ] Duplicate investment → should fail
   - [ ] Network error during transfer → should rollback gracefully

3. **Edge Cases:**
   - [ ] Concurrent investments in same fund
   - [ ] Investment during fund status change
   - [ ] Very large investment amounts
   - [ ] Decimal precision in amounts

## Implementation Order

1. **Investigation Phase** (2-4 hours)
   - Examine all files mentioned above
   - Document findings
   - Choose implementation option

2. **Database Preparation** (30 minutes)
   - Add any required columns
   - Test RPC functions manually

3. **Backend Implementation** (2-3 hours)
   - Add balance verification
   - Implement transfer logic
   - Add error handling
   - Update fund AUM

4. **Testing** (1-2 hours)
   - Unit tests for balance checks
   - Integration tests for full flow
   - Manual testing in UI

5. **Frontend Enhancement** (Optional, 1 hour)
   - Show balance before investment
   - Show warning if insufficient balance
   - Display transfer confirmation

## File Reference

### Key Files to Modify

**Backend:**
- `/home/rdpuser/Desktop/copy-pamm/src/api/controllers/pammControllerSupabase.js` (Line 152, `joinPool` method)

**Frontend (Optional enhancements):**
- `/home/rdpuser/Desktop/broker_agm/src/components/InvertirPAMMModal.jsx`
- `/home/rdpuser/Desktop/broker_agm/src/services/pammService.js`

**Database:**
- Supabase migrations (if schema changes needed)

### Configuration Files

Check these for API URLs and credentials:
- `/home/rdpuser/Desktop/copy-pamm/.env`
- `/home/rdpuser/Desktop/metatrader-api-v2/.env`
- `/home/rdpuser/Desktop/broker_agm/.env`

## Current Status

✅ **Completed:**
- PAMM investment UI/UX
- Investment record creation in database
- Fund validation and minimum investment checks
- Duplicate investment prevention

❌ **Missing:**
- Balance verification before investment
- Actual balance deduction from investor account
- Balance addition to manager/fund account
- Fund AUM update
- Transfer record creation (for audit trail)
- Rollback mechanism if investment fails

⚠️ **Known Issues:**
- Investors can invest unlimited amounts (no balance check)
- MT5 accounts show wrong balances after investment
- No audit trail for fund movements
- Fund AUM doesn't reflect actual invested capital

## Success Criteria

The implementation is complete when:

1. ✅ User cannot invest more than their account balance
2. ✅ After successful investment, investor account balance decreases
3. ✅ After successful investment, manager account balance increases (or virtual tracking is in place)
4. ✅ Fund's `current_aum` accurately reflects total invested capital
5. ✅ Transfer record exists in `internal_transfers` table (if using Option 1)
6. ✅ If any step fails, no balance changes occur (rollback)
7. ✅ All tests pass
8. ✅ Error messages are clear and helpful

## Additional Resources

### Supabase Admin Client

The copy-pamm backend uses `supabaseAdmin` which has full access:

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);
```

### API Client Configuration

Check `/home/rdpuser/Desktop/broker_agm/src/services/pammService.js` for `logicApiClient` configuration to understand how frontend communicates with copy-pamm backend.

### Authentication

The backend receives authenticated user info via:
```javascript
const investorId = req.user.uid;  // Comes from auth middleware
```

Make sure any new API calls maintain this authentication context.

## Questions to Answer During Investigation

1. **Does the `create_transfer_request` RPC function actually modify account balances, or just create a pending record?**
   - Check: Supabase SQL editor, function definition
   - Test: Create a transfer via Wallet and check accounts

2. **Are account balances stored in Supabase or fetched real-time from MT5?**
   - Check: `accounts` table in Supabase
   - Check: metatrader-api-v2 sync mechanisms

3. **What is the MT5 API base URL and how to authenticate?**
   - Check: copy-pamm `.env` file
   - Check: Any existing calls to metatrader-api-v2

4. **Does MT5 Manager API support internal transfers or balance adjustments?**
   - Check: metatrader-api-v2 codebase
   - Check: MT5 documentation (if available)

5. **What happens if a transfer succeeds but investment record creation fails?**
   - Current code: No rollback mechanism
   - Need: Transaction handling or compensation logic

## Contact Points

If you need clarification on architecture decisions, check:
- Git history for recent changes
- README files in each repository
- Comments in the code (especially TODOs)
- Database migration files for schema evolution

## Final Notes

This is a critical feature for production. Take time to:
1. **Understand the full flow** before coding
2. **Choose the right option** based on investigation findings
3. **Test thoroughly** - financial operations must be accurate
4. **Document your changes** - others will maintain this code

The TODO comment in the code (pammControllerSupabase.js:216-226) explains the current limitation. Your job is to implement the missing functionality following the guidance in this document.

Good luck! 🚀
