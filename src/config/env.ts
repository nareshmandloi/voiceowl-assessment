import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

interface Config {
  NODE_ENV: string;
  PORT: number;
  MONGODB_URI: string;
  AZURE_SPEECH_KEY: string;
  AZURE_REGION: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
}

export const config: Config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/voiceowl',
  AZURE_SPEECH_KEY: process.env.AZURE_SPEECH_KEY || 'mock-azure-key',
  AZURE_REGION: process.env.AZURE_REGION || 'eastus',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10) // 100 requests per window
};

// Validate required environment variables
export const validateEnvironment = (): void => {
  const requiredEnvVars = ['NODE_ENV'];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar] && envVar !== 'NODE_ENV') {
      throw new Error(`Required environment variable ${envVar} is not set`);
    }
  }
  
  console.log('✅ Environment variables validated successfully');
};
