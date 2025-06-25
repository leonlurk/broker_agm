import '@testing-library/jest-dom';
import { beforeEach, vi } from 'vitest';

// Mock Firebase modules
vi.mock('../firebase/config', () => ({
  auth: {
    currentUser: null,
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn()
  },
  db: {
    collection: vi.fn(),
    doc: vi.fn()
  }
}));

vi.mock('../firebase/auth', () => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  logoutUser: vi.fn(),
  resetPassword: vi.fn(),
  getCurrentUser: vi.fn(),
  onAuthStateChange: vi.fn()
}));

// Mock environment variables
vi.mock.resolve = {
  ...vi.mock.resolve,
  'import.meta.env': {
    MODE: 'test',
    VITE_ENABLE_LOGGING: 'false',
    VITE_FIREBASE_API_KEY: 'test-api-key',
    VITE_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
    VITE_FIREBASE_PROJECT_ID: 'test-project',
    VITE_FIREBASE_STORAGE_BUCKET: 'test.appspot.com',
    VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
    VITE_FIREBASE_APP_ID: '1:123456789:web:test'
  }
};

// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
  
  // Reset DOM
  document.body.innerHTML = '';
  
  // Mock window.location
  delete window.location;
  window.location = { 
    href: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: ''
  };
});

// Mock console methods in tests to avoid noise
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}; 