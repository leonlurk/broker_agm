import { z } from 'zod';

// Common validation patterns
const positiveNumber = z.number().positive("El valor debe ser positivo");
const nonEmptyString = z.string().min(1, "Este campo es requerido");
const email = z.string().email("Formato de email inválido");

// Authentication Schemas
export const loginSchema = z.object({
  identifier: nonEmptyString.min(3, "Usuario/Email debe tener al menos 3 caracteres"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres")
});

export const registerSchema = z.object({
  username: z.string()
    .min(3, "El usuario debe tener al menos 3 caracteres")
    .max(20, "El usuario no puede tener más de 20 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "El usuario solo puede contener letras, números y guiones bajos"),
  email: email,
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "La contraseña debe contener al menos una mayúscula, una minúscula y un número"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"]
});

// Trading Account Schemas
export const tradingAccountSchema = z.object({
  accountType: z.enum(['demo', 'real', 'challenge'], "Tipo de cuenta inválido"),
  initialBalance: positiveNumber.max(1000000, "Balance inicial muy alto"),
  leverage: z.number().min(1).max(1000, "Apalancamiento debe estar entre 1:1 y 1:1000"),
  currency: z.enum(['USD', 'EUR', 'GBP'], "Moneda no soportada")
});

// Withdrawal Schemas
export const withdrawalSchema = z.object({
  amount: positiveNumber
    .max(100000, "Monto de retiro muy alto")
    .refine((val) => val >= 25, "Monto mínimo de retiro es $25"),
  method: z.enum(['stableCoins', 'onlinePayment'], "Método de retiro inválido"),
  currency: z.enum(['USDT_ETH', 'USDC_ETH', 'USDT_TRC20'], "Criptomoneda no soportada"),
  walletAddress: z.string()
    .min(26, "Dirección de wallet inválida")
    .max(62, "Dirección de wallet demasiado larga")
    .regex(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^0x[a-fA-F0-9]{40}$|^T[A-Za-z1-9]{33}$/, 
           "Formato de dirección de wallet inválido"),
  acceptTerms: z.boolean().refine((val) => val === true, "Debe aceptar los términos y condiciones")
});

// Deposit Schemas
export const depositSchema = z.object({
  amount: positiveNumber
    .min(10, "Monto mínimo de depósito es $10")
    .max(50000, "Monto máximo de depósito es $50,000"),
  method: z.enum(['crypto', 'card', 'bank'], "Método de depósito inválido"),
  currency: z.string().min(3).max(4, "Código de moneda inválido")
});

// Trading Operation Schemas
export const tradingOperationSchema = z.object({
  symbol: z.string().min(6).max(10, "Símbolo de trading inválido"),
  type: z.enum(['buy', 'sell'], "Tipo de operación inválido"),
  volume: positiveNumber.max(100, "Volumen máximo es 100 lotes"),
  stopLoss: z.number().optional(),
  takeProfit: z.number().optional(),
  price: positiveNumber.optional()
}).refine((data) => {
  if (data.stopLoss && data.takeProfit) {
    if (data.type === 'buy') {
      return data.stopLoss < data.price && data.takeProfit > data.price;
    } else {
      return data.stopLoss > data.price && data.takeProfit < data.price;
    }
  }
  return true;
}, "Stop Loss y Take Profit deben tener valores lógicos según el tipo de operación");

// Account Balance Validation
export const balanceUpdateSchema = z.object({
  accountId: nonEmptyString,
  newBalance: z.number().min(0, "El balance no puede ser negativo"),
  transactionType: z.enum(['deposit', 'withdrawal', 'trading', 'adjustment'], "Tipo de transacción inválido"),
  reference: nonEmptyString.optional()
});

// Helper function to validate data against schema
export const validateData = (schema, data) => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    return { 
      success: false, 
      errors: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    };
  }
};

// Helper function for async validation
export const validateDataAsync = async (schema, data) => {
  try {
    const validatedData = await schema.parseAsync(data);
    return { success: true, data: validatedData };
  } catch (error) {
    return { 
      success: false, 
      errors: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    };
  }
};
