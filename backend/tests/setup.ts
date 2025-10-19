// Jest setup file for blockchain tests
import { config } from 'dotenv';

// Load environment variables for testing
config({ path: '.env.test' });

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn()
};

// Set up test timeout
jest.setTimeout(30000);

// Mock WebSocket for blockchain connections if needed
class MockWebSocket {
  onopen: (() => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  onerror: ((error: any) => void) | null = null;
  onclose: (() => void) | null = null;

  constructor(url: string) {
    // Mock WebSocket behavior
  }

  send(data: string) {
    // Mock send
  }

  close() {
    // Mock close
  }
}

// @ts-ignore
global.WebSocket = MockWebSocket;