/**
 * FinTech Lending Platform Configuration
 */

// Detect API Gateway URL (defaults to localhost:8080 when running locally)
export const CONFIG = {
  GATEWAY_URL: window.ENV_GATEWAY_URL || (
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:8080'
      : `${window.location.origin}`
  ),
  
  // Microservice Actuator ports for direct health monitoring if accessed locally
  HEALTH_ENDPOINTS: [
    { id: 'gateway', name: 'API Gateway', port: 8080, path: '/actuator/health' },
    { id: 'auth', name: 'Auth Service', port: 8081, path: '/actuator/health' },
    { id: 'customer', name: 'Customer Service', port: 8082, path: '/actuator/health' },
    { id: 'loan', name: 'Loan Service', port: 8083, path: '/actuator/health' },
    { id: 'payment', name: 'Payment Service', port: 8084, path: '/actuator/health' },
    { id: 'notification', name: 'Notification Service', port: 8085, path: '/actuator/health' }
  ],

  // Endpoints routed through API Gateway
  API: {
    AUTH: {
      LOGIN: '/api/v1/auth/login',
      REGISTER: '/api/v1/auth/register',
      ME: '/api/v1/auth/me'
    },
    CUSTOMERS: {
      BASE: '/api/v1/customers',
      ME: '/api/v1/customers/me'
    },
    LOANS: {
      PRODUCTS: '/api/v1/loans/products',
      APPLICATIONS: '/api/v1/loans/applications',
      ALL_APPLICATIONS: '/api/v1/loans/applications/all',
      SCHEDULE: (id) => `/api/v1/loans/${id}/schedule`,
      APPROVE: (id) => `/api/v1/loans/${id}/approve`,
      REJECT: (id) => `/api/v1/loans/${id}/reject`,
      GET: (id) => `/api/v1/loans/${id}`
    },
    PAYMENTS: {
      BASE: '/api/v1/payments',
      GET: (id) => `/api/v1/payments/${id}`
    },
    NOTIFICATIONS: {
      BASE: '/api/v1/notifications',
      BY_RECIPIENT: (recipient) => `/api/v1/notifications/recipient/${encodeURIComponent(recipient)}`
    }
  },

  // Pre-seeded Credentials for instant testing
  PRESET_ACCOUNTS: {
    ADMIN: { email: 'admin@lending.com', password: 'AdminPassword123', role: 'ADMIN' },
    OFFICER: { email: 'officer@lending.com', password: 'OfficerPassword123', role: 'LOAN_OFFICER' },
    CUSTOMER: { email: 'customer@example.com', password: 'Password123', role: 'CUSTOMER' }
  }
};
