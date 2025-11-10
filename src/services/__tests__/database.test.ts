import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { DatabaseService } from '../database.service';
import { DatabaseInitService } from '../database-init.service';

// Mock Supabase for testing
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: { code: 'PGRST116' } }))
        })),
        limit: vi.fn(() => ({ data: [], error: null }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({ data: { id: '1', key: 'test' }, error: null }))
        }))
      })),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({ data: { id: '1' }, error: null }))
        }))
      }))
    })),
    rpc: vi.fn(() => ({ error: null }))
  },
  handleSupabaseError: vi.fn((error) => {
    throw new Error(error.message || 'Test error');
  }),
  checkDatabaseConnection: vi.fn(() => Promise.resolve(true))
}));

describe('DatabaseService', () => {
  beforeAll(async () => {
    // Reset initialization state
    DatabaseInitService.reset();
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  it('should initialize database successfully', async () => {
    await expect(DatabaseService.initialize()).resolves.not.toThrow();
  });

  it('should handle database connection check', async () => {
    const { checkDatabaseConnection } = await import('../supabase');
    const isConnected = await checkDatabaseConnection();
    expect(isConnected).toBe(true);
  });

  it('should create feedback tasks without error', async () => {
    await expect(DatabaseService.createFeedbackTasks()).resolves.not.toThrow();
  });

  it('should cleanup expired tasks without error', async () => {
    await expect(DatabaseService.cleanupExpiredTasks()).resolves.not.toThrow();
  });

  it('should get dashboard metrics with default values', async () => {
    const metrics = await DatabaseService.getDashboardMetrics();
    expect(metrics).toEqual({
      pendingCount: 0,
      inProgressCount: 0,
      publishedCount: 0,
      todayTasksCount: 0
    });
  });

  it('should get empty publication suggestions', async () => {
    const suggestions = await DatabaseService.getPublicationSuggestions();
    expect(suggestions).toEqual([]);
  });

  it('should get empty morals list', async () => {
    const morals = await DatabaseService.getAllMorals();
    expect(morals).toEqual([]);
  });
});

describe('DatabaseInitService', () => {
  it('should validate schema and return structure', async () => {
    const validation = await DatabaseInitService.validateSchema();
    expect(validation).toHaveProperty('isValid');
    expect(validation).toHaveProperty('missingTables');
    expect(validation).toHaveProperty('errors');
  });

  it('should track initialization state', () => {
    expect(DatabaseInitService.isInitialized()).toBe(false);
    DatabaseInitService.reset();
    expect(DatabaseInitService.isInitialized()).toBe(false);
  });
});