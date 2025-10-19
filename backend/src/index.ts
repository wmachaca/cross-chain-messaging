import express from 'express';
import type { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';//frontend
import helmet from 'helmet';//security
import morgan from 'morgan';//logging
import dotenv from 'dotenv';//environment
//import { EventListener } from './services/EventListener';
//import { MerkleService } from './services/MerkleService';
// TEMPORARILY COMMENTED OUT FOR TESTING:
//import relayerRoutes from './routes/relayerRoutes';
//import healthRoutes from './routes/healthRoutes';

// Load environment variables
dotenv.config();

const app: Application = express();

// Global services
//let eventListener: EventListener;
//let merkleService: MerkleService;

// Configure CORS for cross-chain operations//frontend
const corsOptions: cors.CorsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
};

// Middlewares
app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request ID middleware for tracing cross-chain operations
app.use((req: Request, res: Response, next: NextFunction) => {
  req.headers['x-request-id'] = req.headers['x-request-id'] || 
    `relayer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  next();
});

// Routes - SIMPLIFIED FOR TESTING
// app.use('/health', healthRoutes);
// app.use('/api/relayer', relayerRoutes);

// Simple health check route for testing
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'cross-chain-relayer-test',
  });
});

// Simple relayer status route for testing
app.get('/api/relayer/status', (req: Request, res: Response) => {
  res.json({
    status: 'operational',
    mode: 'testing',
    chainsMonitored: ['none - testing mode'],
    pendingMessages: 0,
    processedMessages: 0,
    uptime: process.uptime(),
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'Cross-Chain Message Relayer',
    version: process.env.npm_package_version || '1.0.0',
    status: 'operational',
    //chains: eventListener?.getMonitoredChains() || [],
    uptime: process.uptime(),
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'];
  
  console.error(`❌ Error [${requestId}]:`, {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    error: 'Internal Server Error',
    requestId,
    ...(isDevelopment && { 
      message: err.message,
      stack: err.stack 
    }),
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  });
});

// Initialize services and start server
async function startServer() {
  try {
    console.log('🧪 Starting test server (no blockchain services)...');
    
    // SERVICES COMMENTED OUT FOR TESTING:
    // merkleService = new MerkleService();
    // eventListener = new EventListener(async (gameMove) => {
    //   console.log('🎮 Received game move:', gameMove);
    // });
    // await eventListener.startListening();
    
    console.log('✅ Test server ready (services disabled)');
  } catch (error) {
    console.error('❌ Failed to start test server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  console.log(`🛑 Received ${signal}. Shutting down gracefully...`);

  try {
    /*if (eventListener) {
      await eventListener.stopListening();
      console.log('Event listener stopped');
    }*/

    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start server (unless testing)
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  
  // Initialize services first, then start HTTP server
  startServer().then(() => {
    app.listen(PORT, () => {
      console.log(`🔥 Cross-Chain Relayer running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      //console.log(`🌐 Monitoring chains: ${eventListener?.getMonitoredChains().join(', ') || 'none'}`);
    });
  }).catch((error) => {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  });
}

export default app;