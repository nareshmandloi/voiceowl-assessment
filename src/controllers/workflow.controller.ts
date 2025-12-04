import { Request, Response } from 'express';
import { WorkflowService } from '../services/workflow.service';

export class WorkflowController {
  private workflowService: WorkflowService;

  constructor() {
    this.workflowService = new WorkflowService();
  }

  /**
   * POST /workflow - Create a new workflow
   */
  createWorkflow = async (req: Request, res: Response): Promise<void> => {
    try {
      const { audioUrl, language } = req.body;

      // Validation
      if (!audioUrl || typeof audioUrl !== 'string') {
        res.status(400).json({
          error: 'audioUrl is required and must be a string'
        });
        return;
      }

      // Basic URL validation
      const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
      if (!urlRegex.test(audioUrl)) {
        res.status(400).json({
          error: 'Invalid audioUrl format'
        });
        return;
      }

      // Language validation (optional)
      if (language && typeof language !== 'string') {
        res.status(400).json({
          error: 'language must be a string'
        });
        return;
      }

      if (language) {
        const langRegex = /^[a-z]{2}-[A-Z]{2}$/;
        if (!langRegex.test(language)) {
          res.status(400).json({
            error: 'language must be in format xx-XX (e.g., en-US, fr-FR)'
          });
          return;
        }
      }

      console.log(`📥 Creating workflow for: ${audioUrl}`);

      const result = await this.workflowService.createWorkflow({
        audioUrl,
        language
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'Workflow created successfully'
      });

    } catch (error) {
      console.error('❌ Error in createWorkflow controller:', error);
      
      res.status(500).json({
        error: 'Failed to create workflow',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * PUT /workflow/:id/transition - Transition workflow to next state
   */
  transitionWorkflow = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { newStatus, comment, reviewedBy } = req.body;

      // Validation
      if (!id) {
        res.status(400).json({
          error: 'Workflow ID is required'
        });
        return;
      }

      if (!newStatus) {
        res.status(400).json({
          error: 'newStatus is required'
        });
        return;
      }

      const validStatuses = ['review', 'approval', 'completed', 'rejected'];
      if (!validStatuses.includes(newStatus)) {
        res.status(400).json({
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
        return;
      }

      console.log(`🔄 Transitioning workflow ${id} to ${newStatus}`);

      const result = await this.workflowService.transitionWorkflow({
        transcriptionId: id,
        newStatus,
        comment,
        reviewedBy
      });

      res.status(200).json({
        success: true,
        data: result,
        message: `Workflow transitioned to ${newStatus}`
      });

    } catch (error) {
      console.error('❌ Error in transitionWorkflow controller:', error);
      
      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 
                        error instanceof Error && error.message.includes('Invalid transition') ? 400 : 500;
      
      res.status(statusCode).json({
        error: 'Failed to transition workflow',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * GET /workflow/:id - Get workflow status
   */
  getWorkflowStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'Workflow ID is required'
        });
        return;
      }

      console.log(`📊 Getting workflow status for: ${id}`);

      const result = await this.workflowService.getWorkflowStatus(id);

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('❌ Error in getWorkflowStatus controller:', error);
      
      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
      
      res.status(statusCode).json({
        error: 'Failed to get workflow status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * GET /workflows - List workflows with optional filtering
   */
  listWorkflows = async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, page = '1', limit = '10' } = req.query;

      // Parse and validate pagination
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      if (isNaN(pageNum) || pageNum < 1) {
        res.status(400).json({
          error: 'page must be a positive integer'
        });
        return;
      }

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        res.status(400).json({
          error: 'limit must be a positive integer between 1 and 100'
        });
        return;
      }

      // Validate status filter if provided
      if (status && typeof status !== 'string') {
        res.status(400).json({
          error: 'status filter must be a string'
        });
        return;
      }

      if (status) {
        const validStatuses = ['transcription', 'review', 'approval', 'completed', 'rejected'];
        if (!validStatuses.includes(status as string)) {
          res.status(400).json({
            error: `Invalid status filter. Must be one of: ${validStatuses.join(', ')}`
          });
          return;
        }
      }

      console.log(`📋 Listing workflows (status: ${status || 'all'}, page: ${pageNum})`);

      const result = await this.workflowService.listWorkflows(
        status as string,
        pageNum,
        limitNum
      );

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('❌ Error in listWorkflows controller:', error);
      
      res.status(500).json({
        error: 'Failed to list workflows',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * GET /workflow/stats - Get workflow statistics
   */
  getWorkflowStats = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('📈 Getting workflow statistics');

      const result = await this.workflowService.getWorkflowStats();

      res.status(200).json({
        success: true,
        data: {
          statistics: result,
          total: Object.values(result).reduce((sum, count) => sum + count, 0)
        }
      });

    } catch (error) {
      console.error('❌ Error in getWorkflowStats controller:', error);
      
      res.status(500).json({
        error: 'Failed to get workflow statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}
