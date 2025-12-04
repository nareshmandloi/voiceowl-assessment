import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config, validateEnvironment } from './config/env';
import { database } from './config/database';
import { TranscriptionRoutes } from './routes/transcription.routes';
import workflowRoutes from './routes/workflow.routes';
import { ErrorHandler } from './middleware/error.handler';
import { generalRateLimit } from './middleware/rate-limiter';

export class App {
  public app: Application;
  private transcriptionRoutes: TranscriptionRoutes;

  constructor() {
    this.app = express();
    this.transcriptionRoutes = new TranscriptionRoutes();
    
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // CORS middleware - Allow file:// access and all origins in development
    this.app.use(cors({
      origin: function (origin, callback) {
        // Always allow requests with no origin (file://, Postman, mobile apps, etc.)
        if (!origin) return callback(null, true);
        
        if (process.env.NODE_ENV === 'production') {
          // In production, only allow specific domains
          const allowedOrigins = ['https://yourdomain.com'];
          return callback(null, allowedOrigins.includes(origin));
        } else {
          // In development, allow all origins
          return callback(null, true);
        }
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: false
    }));

    // Security middleware - Relaxed for development
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      } : false, // Disable CSP in development
    }));

    // Logging middleware
    if (config.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // General rate limiting
    this.app.use(generalRateLimit);

    // Trust proxy for accurate IP addresses
    this.app.set('trust proxy', 1);
  }

  private initializeRoutes(): void {
    // Serve static files from client directory
    this.app.use('/client', express.static('client'));

    // API routes mounted directly at root level as per requirements
    this.app.use('/', this.transcriptionRoutes.getRouter());
    this.app.use('/', workflowRoutes);
  }

  private initializeErrorHandling(): void {
    // 404 handler for undefined routes
    this.app.use(ErrorHandler.notFound);

    // Global error handler
    this.app.use(ErrorHandler.handle);
  }

  public async start(): Promise<void> {
    try {
      // Validate environment variables
      validateEnvironment();

      // Connect to MongoDB (don't let this fail the server startup)
      await database.connect();

      // Start the server
      this.app.listen(config.PORT, () => {
        console.log(`🚀 Transcription API server running on port ${config.PORT}`);
        console.log(`📍 Environment: ${config.NODE_ENV}`);
        console.log(`🔗 API Base URL: http://localhost:${config.PORT}`);
        
        if (config.NODE_ENV === 'development') {
          console.log(`📚 Available endpoints:`);
          console.log(`   POST /transcription`);
          console.log(`   POST /azure-transcription`);
          console.log(`   GET  /transcriptions`);
          console.log(`   POST /workflow`);
          console.log(`   PUT  /workflow/:id/transition`);
          console.log(`   GET  /workflow/:id`);
          console.log(`   GET  /workflows`);
          console.log(`   GET  /workflow/stats`);
        }
      });

    } catch (error) {
      console.error('❌ Failed to start server:', error);
      // Only exit if it's a critical error, not database connection
      if (error instanceof Error && !error.message.includes('MongoDB')) {
        process.exit(1);
      }
    }
  }

  public async shutdown(): Promise<void> {
    try {
      console.log('🔄 Gracefully shutting down server...');
      
      // Disconnect from database
      await database.disconnect();
      
      console.log('✅ Server shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📡 SIGTERM received');
  const app = new App();
  await app.shutdown();
});

process.on('SIGINT', async () => {
  console.log('📡 SIGINT received');
  const app = new App();
  await app.shutdown();
});

// Handle uncaught exceptions (but don't exit immediately for database errors)
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  // Only exit for non-database related errors
  if (!error.message.includes('MongoDB') && !error.message.includes('ECONNREFUSED')) {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  // Only exit for non-database related errors
  if (reason instanceof Error && !reason.message.includes('MongoDB') && !reason.message.includes('ECONNREFUSED')) {
    process.exit(1);
  }
});
