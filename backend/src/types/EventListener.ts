import type { PublicClient, WatchBlockNumberReturnType } from 'viem';

export interface ChainState {
  lastProcessedBlock: number;
  isHealthy: boolean;
  consecutiveErrors: number;
  lastError?: string;
}

export interface EventListenerMetrics {
  totalEventsProcessed: number;
  eventsPerChain: Map<number, number>;
  lastEventTimestamp: number;
  startTime: number;
}

export interface ChainConfig {
  maxConsecutiveErrors: number;
  healthCheckInterval: number;
  retryDelay: number;
  blockConfirmationBuffer: number;
}

export interface EventListenerStatus {
  isListening: boolean;
  chainsMonitored: number[];
  activeWatchers: number;
  chainStates: Record<number, ChainState>;
  metrics: EventListenerMetrics & {
    eventsPerChain: Record<number, number>;
    uptime: number;
  };
}

export interface ChainClients {
  clients: Map<number, PublicClient>;
  contracts: Map<number, any>;
  unwatchFunctions: Map<number, WatchBlockNumberReturnType>;
}
