import { SquareClient, SquareEnvironment } from 'square';

// Square configuration
const squareConfig = {
  environment: process.env.SQUARE_ENVIRONMENT === 'production'
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox,
  customUrl: undefined,
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  userAgentDetail: 'SteppersLife Events Platform',
  additionalHeaders: {}
};

// Initialize Square client
export const squareClient = new SquareClient(squareConfig);

// Export API instances for easy access
export const paymentsApi = squareClient.paymentsApi;
export const customersApi = squareClient.customersApi;
export const ordersApi = squareClient.ordersApi;
export const locationsApi = squareClient.locationsApi;
export const catalogApi = squareClient.catalogApi;
export const subscriptionsApi = squareClient.subscriptionsApi;
export const webhooksApi = squareClient.webhooksApi;

// Configuration constants
export const SQUARE_CONFIG = {
  applicationId: process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID,
  locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
  webhookSignatureKey: process.env.SQUARE_WEBHOOK_SIGNATURE_KEY,
  environment: squareConfig.environment,
} as const;

// Validate required configuration
if (!squareConfig.accessToken) {
  throw new Error('Square access token is required');
}

if (!SQUARE_CONFIG.applicationId) {
  throw new Error('Square application ID is required');
}

if (!SQUARE_CONFIG.locationId) {
  throw new Error('Square location ID is required');
}