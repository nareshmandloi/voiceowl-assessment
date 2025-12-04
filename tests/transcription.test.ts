import request from 'supertest';
import { App } from '../src/app';
import { Transcription } from '../src/models/Transcription.model';

describe('Transcription API', () => {
  let app: App;

  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/voiceowl-test';
    
    app = new App();
    
    // Wait a bit for app initialization
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    if (app) {
      await app.shutdown();
    }
  });

  describe('POST /api/transcription', () => {
    it('should create a new transcription with valid audioUrl', async () => {
      const audioUrl = 'https://example.com/sample.mp3';
      
      const response = await request(app.app)
        .post('/api/transcription')
        .send({ audioUrl })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('message', 'Transcription saved');
      expect(response.body.id).toBeDefined();

      // Verify transcription was saved to database
      const transcription = await Transcription.findById(response.body.id);
      expect(transcription).toBeTruthy();
      expect(transcription?.audioUrl).toBe(audioUrl);
      expect(transcription?.source).toBe('mock');
      expect(transcription?.transcription).toBeDefined();
    });

    it('should return 400 for missing audioUrl', async () => {
      const response = await request(app.app)
        .post('/api/transcription')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBe('audioUrl is required');
    });

    it('should return 400 for invalid audioUrl format', async () => {
      const response = await request(app.app)
        .post('/api/transcription')
        .send({ audioUrl: 'invalid-url' })
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBe('Invalid audioUrl format');
    });

    it('should handle different valid URL formats', async () => {
      const validUrls = [
        'https://example.com/audio.mp3',
        'http://test.com/file.wav',
        'ftp://files.example.org/audio/sample.flac'
      ];

      for (const audioUrl of validUrls) {
        const response = await request(app.app)
          .post('/api/transcription')
          .send({ audioUrl })
          .expect(201);

        expect(response.body.id).toBeDefined();
      }
    });
  });

  describe('POST /api/azure-transcription', () => {
    it('should create Azure transcription with valid audioUrl', async () => {
      const audioUrl = 'https://example.com/azure-sample.mp3';
      
      const response = await request(app.app)
        .post('/api/azure-transcription')
        .send({ audioUrl })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.message).toContain('Transcription saved');

      // Verify transcription source
      const transcription = await Transcription.findById(response.body.id);
      expect(transcription).toBeTruthy();
      expect(transcription?.audioUrl).toBe(audioUrl);
      expect(['azure', 'mock']).toContain(transcription?.source); // Could be azure or fallback to mock
    });

    it('should return 400 for missing audioUrl', async () => {
      const response = await request(app.app)
        .post('/api/azure-transcription')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBe('audioUrl is required');
    });
  });

  describe('GET /api/transcriptions', () => {
    beforeEach(async () => {
      // Create test transcriptions with different dates
      const now = new Date();
      const twentyDaysAgo = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
      const fortyDaysAgo = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000);

      await Transcription.create([
        {
          audioUrl: 'https://example.com/recent1.mp3',
          transcription: 'Recent transcription 1',
          source: 'mock',
          createdAt: now
        },
        {
          audioUrl: 'https://example.com/recent2.mp3',
          transcription: 'Recent transcription 2',
          source: 'azure',
          createdAt: twentyDaysAgo
        },
        {
          audioUrl: 'https://example.com/old.mp3',
          transcription: 'Old transcription',
          source: 'mock',
          createdAt: fortyDaysAgo
        }
      ]);
    });

    it('should return only transcriptions from last 30 days', async () => {
      const response = await request(app.app)
        .get('/api/transcriptions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2); // Only recent ones
      expect(response.body.pagination.total).toBe(2);

      // Should not include the 40-day-old transcription
      const audioUrls = response.body.data.map((t: any) => t.audioUrl);
      expect(audioUrls).not.toContain('https://example.com/old.mp3');
    });

    it('should support pagination', async () => {
      const response = await request(app.app)
        .get('/api/transcriptions?page=1&limit=1')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.pagination.total).toBe(2);
      expect(response.body.pagination.totalPages).toBe(2);
    });

    it('should return transcriptions in descending order by createdAt', async () => {
      const response = await request(app.app)
        .get('/api/transcriptions')
        .expect(200);

      const transcriptions = response.body.data;
      expect(transcriptions).toHaveLength(2);
      
      // First transcription should be the most recent
      expect(new Date(transcriptions[0].createdAt) >= new Date(transcriptions[1].createdAt)).toBe(true);
    });

    it('should return 400 for invalid pagination parameters', async () => {
      const response = await request(app.app)
        .get('/api/transcriptions?page=0&limit=200')
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('Invalid pagination parameters');
    });
  });

  describe('GET /api/transcription/:id', () => {
    let transcriptionId: string;

    beforeEach(async () => {
      const transcription = await Transcription.create({
        audioUrl: 'https://example.com/test.mp3',
        transcription: 'Test transcription',
        source: 'mock'
      });
      transcriptionId = transcription._id.toString();
    });

    it('should return transcription by valid ID', async () => {
      const response = await request(app.app)
        .get(`/api/transcription/${transcriptionId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(transcriptionId);
      expect(response.body.data.audioUrl).toBe('https://example.com/test.mp3');
      expect(response.body.data.transcription).toBe('Test transcription');
    });

    it('should return 404 for non-existent ID', async () => {
      const fakeId = '507f1f77bcf86cd799439011'; // Valid ObjectId format but doesn't exist
      
      const response = await request(app.app)
        .get(`/api/transcription/${fakeId}`)
        .expect(404);

      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toBe('Transcription not found');
    });

    it('should return 500 for invalid ID format', async () => {
      const response = await request(app.app)
        .get('/api/transcription/invalid-id')
        .expect(500);

      expect(response.body.error).toBe('Internal Server Error');
    });
  });

  describe('GET /api/azure/health', () => {
    it('should return Azure service health status', async () => {
      const response = await request(app.app)
        .get('/api/azure/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('region');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(response.body.data.status);
    });
  });

  describe('GET /health', () => {
    it('should return API health status', async () => {
      const response = await request(app.app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('GET /', () => {
    it('should return API documentation', async () => {
      const response = await request(app.app)
        .get('/')
        .expect(200);

      expect(response.body.message).toBe('VoiceOwl Transcription API');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body.endpoints).toHaveProperty('transcription');
      expect(response.body.endpoints).toHaveProperty('azureTranscription');
      expect(response.body.endpoints).toHaveProperty('getTranscriptions');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for undefined routes', async () => {
      const response = await request(app.app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toContain('Route GET /api/nonexistent not found');
    });
  });
});
