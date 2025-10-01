import axios from 'axios';
import { logger } from '../utils/logger';
import { supabase } from '../supabase/config';

// Direct equity fetch with Supabase authentication
const BASE = (import.meta.env.VITE_BROKER_API_URL || import.meta.env.VITE_API_BASE_URL || 'https://apekapital.com:444');

const client = axios.create({
  baseURL: BASE,
  timeout: 60000, // Aumentado a 60 segundos
  headers: { 'Content-Type': 'application/json' }
});

// Add auth interceptor
client.interceptors.request.use(
  async config => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (error) {
      logger.error('[EquityDirect] Error getting auth token:', error);
    }
    return config;
  },
  error => Promise.reject(error)
);

// simple in-memory cache to avoid rate limits
const cache = new Map(); // key: accountNumber -> { equity, ts }

export async function getEquityDirect(accountNumber) {
  try {
    const cached = cache.get(accountNumber);
    const now = Date.now();
    if (cached && now - cached.ts < 30000) {
      return { equity: cached.equity, raw: { cached: true } };
    }
    const url = `/api/v1/accounts/${accountNumber}/metrics`;
    logger.info('[EquityDirect] GET', { url, base: client.defaults.baseURL });
    let res;
    try {
      res = await client.get(url);
    } catch (err) {
      // Retry once on 429 with small backoff
      if (err?.response?.status === 429) {
        await new Promise(r => setTimeout(r, 1200));
        res = await client.get(url);
      } else {
        throw err;
      }
    }
    const equity = Number(res?.data?.equity ?? 0);
    cache.set(accountNumber, { equity, ts: now });
    return { equity, raw: res.data };
  } catch (err) {
    logger.error('[EquityDirect] Error fetching equity', {
      message: err.message,
      status: err.response?.status
    });
    // fallback to cached value if present
    const cached = cache.get(accountNumber);
    if (cached) return { equity: cached.equity, cached: true };
    return { equity: null, error: err.message };
  }
}

export default { getEquityDirect };
