import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { App } from '../src/app';

describe('Workflow API', () => {
  let mongoServer: MongoMemoryServer;
  let app: App;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Disconnect any existing connection first
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    // Connect to the in-memory database
    await mongoose.connect(mongoUri);
    
    // Create app instance without auto-connecting to DB
    app = new App();
  });

  afterAll(async () => {
    // Clean up
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  afterEach(async () => {
    // Clear all collections between tests
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  describe('POST /workflow', () => {
    it('should create a new workflow successfully', async () => {
      const response = await request(app.app)
        .post('/workflow')
        .send({
          audioUrl: 'https://example.com/sample.mp3',
          language: 'en-US'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.currentStatus).toBe('transcription');
      expect(response.body.data.canTransition).toContain('review');
      expect(response.body.data.canTransition).toContain('rejected');
    });

    it('should validate audioUrl is required', async () => {
      const response = await request(app.app)
        .post('/workflow')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('audioUrl is required and must be a string');
    });

    it('should validate audioUrl format', async () => {
      const response = await request(app.app)
        .post('/workflow')
        .send({
          audioUrl: 'invalid-url'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid audioUrl format');
    });

    it('should validate language format', async () => {
      const response = await request(app.app)
        .post('/workflow')
        .send({
          audioUrl: 'https://example.com/sample.mp3',
          language: 'invalid-lang'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('language must be in format xx-XX (e.g., en-US, fr-FR)');
    });
  });

  describe('PUT /workflow/:id/transition', () => {
    let workflowId: string;

    beforeEach(async () => {
      // Create a workflow first
      const response = await request(app.app)
        .post('/workflow')
        .send({
          audioUrl: 'https://example.com/sample.mp3'
        });
      
      workflowId = response.body.data.id;
    });

    it('should transition workflow from transcription to review', async () => {
      const response = await request(app.app)
        .put(`/workflow/${workflowId}/transition`)
        .send({
          newStatus: 'review',
          comment: 'Moving to review phase',
          reviewedBy: 'test-user'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.currentStatus).toBe('review');
      expect(response.body.data.canTransition).toContain('approval');
      expect(response.body.data.workflowHistory).toHaveLength(2);
    });

    it('should reject invalid transitions', async () => {
      const response = await request(app.app)
        .put(`/workflow/${workflowId}/transition`)
        .send({
          newStatus: 'completed' // Invalid: can't go directly from transcription to completed
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Failed to transition workflow');
      expect(response.body.message).toContain('Invalid transition');
    });

    it('should validate newStatus is required', async () => {
      const response = await request(app.app)
        .put(`/workflow/${workflowId}/transition`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('newStatus is required');
    });

    it('should handle non-existent workflow', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      
      const response = await request(app.app)
        .put(`/workflow/${fakeId}/transition`)
        .send({
          newStatus: 'review'
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Failed to transition workflow');
      expect(response.body.message).toBe('Transcription not found');
    });
  });

  describe('GET /workflow/:id', () => {
    let workflowId: string;

    beforeEach(async () => {
      // Create a workflow first
      const response = await request(app.app)
        .post('/workflow')
        .send({
          audioUrl: 'https://example.com/sample.mp3'
        });
      
      workflowId = response.body.data.id;
    });

    it('should get workflow status successfully', async () => {
      const response = await request(app.app)
        .get(`/workflow/${workflowId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(workflowId);
      expect(response.body.data.currentStatus).toBe('transcription');
      expect(response.body.data).toHaveProperty('workflowHistory');
      expect(response.body.data).toHaveProperty('canTransition');
    });

    it('should handle non-existent workflow', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      
      const response = await request(app.app)
        .get(`/workflow/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Failed to get workflow status');
      expect(response.body.message).toBe('Transcription not found');
    });
  });

  describe('GET /workflows', () => {
    beforeEach(async () => {
      // Create multiple workflows
      await request(app.app)
        .post('/workflow')
        .send({ audioUrl: 'https://example.com/sample1.mp3' });
      
      await request(app.app)
        .post('/workflow')
        .send({ audioUrl: 'https://example.com/sample2.mp3' });
    });

    it('should list all workflows', async () => {
      const response = await request(app.app)
        .get('/workflows');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.workflows).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(10);
    });

    it('should filter workflows by status', async () => {
      const response = await request(app.app)
        .get('/workflows?status=transcription');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.workflows).toHaveLength(2);
      expect(response.body.data.workflows.every((w: any) => w.workflowStatus === 'transcription')).toBe(true);
    });

    it('should handle pagination', async () => {
      const response = await request(app.app)
        .get('/workflows?page=1&limit=1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.workflows).toHaveLength(1);
      expect(response.body.data.total).toBe(2);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(1);
    });

    it('should validate invalid status filter', async () => {
      const response = await request(app.app)
        .get('/workflows?status=invalid');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid status filter');
    });
  });

  describe('GET /workflow/stats', () => {
    beforeEach(async () => {
      // Create workflows in different states
      const workflow1 = await request(app.app)
        .post('/workflow')
        .send({ audioUrl: 'https://example.com/sample1.mp3' });
      
      const workflow2 = await request(app.app)
        .post('/workflow')
        .send({ audioUrl: 'https://example.com/sample2.mp3' });

      // Transition one to review
      await request(app.app)
        .put(`/workflow/${workflow2.body.data.id}/transition`)
        .send({ newStatus: 'review' });
    });

    it('should get workflow statistics', async () => {
      const response = await request(app.app)
        .get('/workflow/stats');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('statistics');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data.statistics.transcription).toBeGreaterThanOrEqual(1);
      expect(response.body.data.statistics.review).toBeGreaterThanOrEqual(1);
      expect(response.body.data.total).toBe(2);
    });
  });

  describe('Workflow Auto-progression', () => {
    it('should auto-progress workflow asynchronously', async () => {
      // Create a workflow
      const createResponse = await request(app.app)
        .post('/workflow')
        .send({
          audioUrl: 'https://example.com/sample.mp3'
        });

      const workflowId = createResponse.body.data.id;

      // Wait for auto-progression (should happen after 2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2500));

      const statusResponse = await request(app.app)
        .get(`/workflow/${workflowId}`);

      // Should have auto-progressed to review
      expect(statusResponse.body.data.currentStatus).toBe('review');
      expect(statusResponse.body.data.workflowHistory).toHaveLength(2);
      expect(statusResponse.body.data.workflowHistory[1].reviewedBy).toBe('system');
    }, 10000); // Increase timeout for async test
  });
});
