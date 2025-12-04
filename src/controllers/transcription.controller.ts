import { Request, Response } from 'express';
import { TranscriptionService, CreateTranscriptionRequest } from '../services/transcription.service';
import { AzureService, AzureTranscriptionRequest } from '../services/azure.service';

export interface TranscriptionRequestBody {
  audioUrl: string;
  language?: string;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export class TranscriptionController {
  private transcriptionService: TranscriptionService;
  private azureService: AzureService;

  constructor() {
    this.transcriptionService = new TranscriptionService();
    this.azureService = new AzureService();
  }

  /**
   * POST /transcription - Create mock transcription
   */
  public createTranscription = async (req: Request<{}, {}, TranscriptionRequestBody>, res: Response): Promise<void> => {
    try {
      // Validate request body
      const { audioUrl } = req.body;
      
      if (!audioUrl) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'audioUrl is required'
        });
        return;
      }

      // Validate URL format
      try {
        new URL(audioUrl);
      } catch {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid audioUrl format'
        });
        return;
      }

      // Extract language parameter (optional)
      const { language } = req.body;

      console.log(`📋 Creating transcription for: ${audioUrl}${language ? ` (language: ${language})` : ''}`);

      // Create transcription with language support
      const result = await this.transcriptionService.createTranscription({ audioUrl, language });

      res.status(201).json(result);
    } catch (error) {
      console.error('❌ Error in createTranscription controller:', error);
      
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create transcription'
      });
    }
  };

  /**
   * POST /azure-transcription - Create Azure transcription
   */
  public createAzureTranscription = async (req: Request<{}, {}, TranscriptionRequestBody>, res: Response): Promise<void> => {
    try {
      // Validate request body
      const { audioUrl } = req.body;
      
      if (!audioUrl) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'audioUrl is required'
        });
        return;
      }

      // Validate URL format
      try {
        new URL(audioUrl);
      } catch {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid audioUrl format'
        });
        return;
      }

      // Extract language parameter (optional)
      const { language } = req.body;

      console.log(`📋 Creating Azure transcription for: ${audioUrl}${language ? ` (language: ${language})` : ''}`);

      // Create Azure transcription with language support
      const result = await this.azureService.createAzureTranscription({ audioUrl, language });

      res.status(201).json(result);
    } catch (error) {
      console.error('❌ Error in createAzureTranscription controller:', error);
      
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create Azure transcription'
      });
    }
  };

  /**
   * GET /transcriptions - Get recent transcriptions (last 30 days)
   */
  public getRecentTranscriptions = async (req: Request<{}, {}, {}, PaginationQuery>, res: Response): Promise<void> => {
    try {
      // Parse pagination parameters
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '10', 10);

      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid pagination parameters. Page must be >= 1, limit must be 1-100'
        });
        return;
      }

      console.log(`📊 Fetching transcriptions - page: ${page}, limit: ${limit}`);

      // Get transcriptions
      const result = await this.transcriptionService.getRecentTranscriptions(page, limit);

      res.status(200).json({
        success: true,
        data: result.transcriptions,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit)
        }
      });
    } catch (error) {
      console.error('❌ Error in getRecentTranscriptions controller:', error);
      
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch transcriptions'
      });
    }
  };

}
