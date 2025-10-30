import { EventListener } from '../src/services/EventListener';
import { createPublicClient, http } from 'viem';
import { anvil } from '../src/config/chains/anvil';
import { GameMove } from '../src/models/GameMove';

// Mock viem clients and contracts
jest.mock('viem', () => ({
  createPublicClient: jest.fn(),
  getContract: jest.fn(),
  http: jest.fn(),
  parseAbi: jest.fn(),
  parseAbiItem: jest.fn(),
}));

// Mock wagmi config
jest.mock('../src/config/wagmi', () => ({
  config: {
    chains: [
      {
        id: 31337,
        name: 'Anvil',
        network: 'anvil',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: ['http://127.0.0.1:8545'] } },
      },
    ],
  },
  CONTRACT_ADDRESSES: {
    31337: '0x1234567890123456789012345678901234567890',
  },
}));

describe('EventListener', () => {
  let eventListener: EventListener;
  let mockClient: any;
  let gameMovesReceived: GameMove[] = [];

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    gameMovesReceived = [];

    // Setup mock client
    mockClient = {
      watchBlockNumber: jest.fn(),
      getBlockNumber: jest.fn(),
      getLogs: jest.fn(),
    };

    // Mock createPublicClient to return our mock
    (createPublicClient as jest.Mock).mockReturnValue(mockClient);
  });

  afterEach(async () => {
    if (eventListener) {
      await eventListener.stopListening();
    }
  });

  describe('Initialization', () => {
    test('should initialize clients for all configured chains', () => {
      eventListener = new EventListener();
      
      expect(createPublicClient).toHaveBeenCalledTimes(1);
      expect(eventListener.getMonitoredChains()).toEqual([31337]);
    });

    test('should extend EventEmitter for proper event handling', () => {
      eventListener = new EventListener();
      
      expect(eventListener.isActive()).toBe(false);
      expect(eventListener.getMonitoredChains()).toEqual([31337]);
      expect(typeof eventListener.on).toBe('function');
      expect(typeof eventListener.emit).toBe('function');
    });
  });

  describe('Event Listening', () => {
    beforeEach(() => {
      eventListener = new EventListener();
      
      // Setup event listener to capture emitted game moves
      eventListener.on('gameMoveDetected', (gameMove: GameMove) => {
        gameMovesReceived.push(gameMove);
      });
    });

    test('should start listening successfully', async () => {
      const mockUnwatch = jest.fn();
      mockClient.watchBlockNumber.mockReturnValue(mockUnwatch);

      await eventListener.startListening();

      expect(eventListener.isActive()).toBe(true);
      expect(mockClient.watchBlockNumber).toHaveBeenCalledWith(
        expect.objectContaining({
          poll: true,
          pollingInterval: 1000,
          onBlockNumber: expect.any(Function),
        })
      );
    });

    test('should not start listening if already active', async () => {
      const mockUnwatch = jest.fn();
      mockClient.watchBlockNumber.mockReturnValue(mockUnwatch);

      await eventListener.startListening();
      await eventListener.startListening(); // Second call

      // Should only be called once
      expect(mockClient.watchBlockNumber).toHaveBeenCalledTimes(1);
    });

    test('should stop listening successfully', async () => {
      const mockUnwatch = jest.fn();
      mockClient.watchBlockNumber.mockReturnValue(mockUnwatch);

      await eventListener.startListening();
      await eventListener.stopListening();

      expect(eventListener.isActive()).toBe(false);
      expect(mockUnwatch).toHaveBeenCalled();
    });
  });

  describe('Block Processing', () => {
    beforeEach(() => {
      eventListener = new EventListener();
      
      // Setup event listener to capture emitted game moves
      eventListener.on('gameMoveDetected', (gameMove: GameMove) => {
        gameMovesReceived.push(gameMove);
      });
    });

    test('should process new blocks with finality check', async () => {
      const mockUnwatch = jest.fn();
      mockClient.watchBlockNumber.mockReturnValue(mockUnwatch);
      mockClient.getBlockNumber.mockResolvedValue(BigInt(100));
      mockClient.getLogs.mockResolvedValue([]);

      await eventListener.startListening();

      // Simulate a new block callback
      const onBlockNumber = mockClient.watchBlockNumber.mock.calls[0][0].onBlockNumber;
      await onBlockNumber(BigInt(98)); // Block with finality

      expect(mockClient.getBlockNumber).toHaveBeenCalled();
      expect(mockClient.getLogs).toHaveBeenCalled();
    });

    test('should skip processing blocks without finality', async () => {
      const mockUnwatch = jest.fn();
      mockClient.watchBlockNumber.mockReturnValue(mockUnwatch);
      mockClient.getBlockNumber.mockResolvedValue(BigInt(100));

      await eventListener.startListening();

      // Simulate a new block callback for a very recent block
      const onBlockNumber = mockClient.watchBlockNumber.mock.calls[0][0].onBlockNumber;
      await onBlockNumber(BigInt(100)); // Current block, no finality

      expect(mockClient.getLogs).not.toHaveBeenCalled();
    });
  });

  describe('Event Processing', () => {
    beforeEach(() => {
      eventListener = new EventListener();
      
      // Setup event listener to capture emitted game moves
      eventListener.on('gameMoveDetected', (gameMove: GameMove) => {
        gameMovesReceived.push(gameMove);
      });
    });

    test('should emit gameMoveDetected events correctly', async () => {
      const mockUnwatch = jest.fn();
      mockClient.watchBlockNumber.mockReturnValue(mockUnwatch);
      mockClient.getBlockNumber.mockResolvedValue(BigInt(100));

      // Mock event log
      const mockEventLog = {
        args: [
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', // gameId
          '0x742d35Cc6634C0532925a3b8D17B8A6c7D8900b0', // player
          1, // move
          BigInt(95), // blockNumber
          BigInt('1000000000000000000'), // balance (1 ETH)
        ],
        transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        blockNumber: BigInt(95),
      };

      mockClient.getLogs.mockResolvedValue([mockEventLog]);

      await eventListener.startListening();

      // Trigger block processing
      const onBlockNumber = mockClient.watchBlockNumber.mock.calls[0][0].onBlockNumber;
      await onBlockNumber(BigInt(98));

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify event was emitted
      expect(gameMovesReceived).toHaveLength(1);
      expect(gameMovesReceived[0]).toMatchObject({
        gameId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        player: '0x742d35Cc6634C0532925a3b8D17B8A6c7D8900b0',
        move: 1,
        chainId: 31337,
        blockNumber: 95,
        balance: '1000000000000000000',
        txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        timestamp: expect.any(Number),
      });
    });

    test('should handle event processing errors gracefully', async () => {
      const mockUnwatch = jest.fn();
      mockClient.watchBlockNumber.mockReturnValue(mockUnwatch);
      mockClient.getBlockNumber.mockResolvedValue(BigInt(100));
      mockClient.getLogs.mockRejectedValue(new Error('Network error'));

      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await eventListener.startListening();

      // Trigger block processing
      const onBlockNumber = mockClient.watchBlockNumber.mock.calls[0][0].onBlockNumber;
      await onBlockNumber(BigInt(98));

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error getting events for chain'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Status and Utility Methods', () => {
    test('should return correct status information', () => {
      eventListener = new EventListener();
      
      const status = eventListener.getStatus();
      expect(status).toEqual({
        isListening: false,
        chainsMonitored: [31337],
        activeWatchers: 0,
      });
    });

    test('should return monitored chains', () => {
      eventListener = new EventListener();
      
      expect(eventListener.getMonitoredChains()).toEqual([31337]);
    });
  });
});
