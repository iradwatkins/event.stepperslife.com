import { SquareClient, SquareEnvironment } from 'square';

// Square configuration
const squareConfig = {
  environment: process.env.SQUARE_ENVIRONMENT === 'production'
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox,
  token: process.env.SQUARE_ACCESS_TOKEN
};

// Initialize Square client
export const squareClient = new SquareClient(squareConfig);

// Export API instances for easy access
export const payments = squareClient.payments;
export const customers = squareClient.customers;
export const orders = squareClient.orders;
export const locations = squareClient.locations;
export const catalog = squareClient.catalog;
export const subscriptions = squareClient.subscriptions;
export const webhooks = squareClient.webhooks;

// Configuration constants
export const SQUARE_CONFIG = {
  applicationId: process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID,
  locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
  webhookSignatureKey: process.env.SQUARE_WEBHOOK_SIGNATURE_KEY,
  environment: squareConfig.environment,
} as const;

// Validate required configuration
if (!squareConfig.token) {
  throw new Error('Square access token is required');
}

if (!SQUARE_CONFIG.applicationId) {
  throw new Error('Square application ID is required');
}

if (!SQUARE_CONFIG.locationId) {
  throw new Error('Square location ID is required');
}