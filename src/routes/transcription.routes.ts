import { Router } from 'express';
import { TranscriptionController } from '../controllers/transcription.controller';
import { ErrorHandler } from '../middleware/error.handler';
import { transcriptionRateLimit, azureRateLimit } from '../middleware/rate-limiter';

export class TranscriptionRoutes {
  private router: Router;
  private transcriptionController: TranscriptionController;

  constructor() {
    this.router = Router();
    this.transcriptionController = new TranscriptionController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @route   POST /transcription
     * @desc    Create mock transcription
     * @access  Public
     * @body    { audioUrl: string }
     * @returns { id: string, message: string }
     */
    this.router.post(
      '/transcription',
      transcriptionRateLimit,
      ErrorHandler.asyncHandler(this.transcriptionController.createTranscription)
    );

    /**
     * @route   POST /azure-transcription
     * @desc    Create Azure transcription (mocked)
     * @access  Public
     * @body    { audioUrl: string }
     * @returns { id: string, message: string }
     */
    this.router.post(
      '/azure-transcription',
      azureRateLimit,
      ErrorHandler.asyncHandler(this.transcriptionController.createAzureTranscription)
    );

    /**
     * @route   GET /transcriptions
     * @desc    Get recent transcriptions (last 30 days)
     * @access  Public
     * @query   page?: number, limit?: number
     * @returns { success: boolean, data: ITranscription[], pagination: object }
     */
    this.router.get(
      '/transcriptions',
      ErrorHandler.asyncHandler(this.transcriptionController.getRecentTranscriptions)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
