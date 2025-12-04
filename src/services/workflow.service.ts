import { Transcription, ITranscription } from '../models/Transcription.model';
import { Types } from 'mongoose';

export interface WorkflowTransitionRequest {
  transcriptionId: string;
  newStatus: 'review' | 'approval' | 'completed' | 'rejected';
  comment?: string;
  reviewedBy?: string;
}

export interface WorkflowCreateRequest {
  audioUrl: string;
  language?: string;
}

export interface WorkflowStatusResponse {
  id: string;
  currentStatus: string;
  workflowHistory: Array<{
    status: string;
    timestamp: Date;
    comment?: string;
    reviewedBy?: string;
  }>;
  canTransition: string[];
}

export interface WorkflowListResponse {
  workflows: ITranscription[];
  total: number;
  page: number;
  limit: number;
}

export class WorkflowService {
  private readonly validTransitions: Record<string, string[]> = {
    'transcription': ['review', 'rejected'],
    'review': ['approval', 'rejected', 'transcription'], // Allow back to transcription for revisions
    'approval': ['completed', 'rejected'],
    'completed': [], // Final state
    'rejected': ['transcription'] // Allow restart from transcription
  };

  /**
   * Create a new workflow starting with transcription phase
   */
  async createWorkflow(request: WorkflowCreateRequest): Promise<WorkflowStatusResponse> {
    try {
      // Mock audio download and transcription (similar to existing service)
      console.log(`🎵 Starting workflow for audio: ${request.audioUrl}`);
      
      await this.mockAudioDownload(request.audioUrl);
      const transcriptionText = this.generateMockTranscription(request.language || 'en-US');
      
      // Create transcription with initial workflow state
      const transcription = new Transcription({
        audioUrl: request.audioUrl,
        transcription: transcriptionText,
        source: 'mock',
        language: request.language || 'en-US',
        workflowStatus: 'transcription',
        workflowHistory: [{
          status: 'transcription',
          timestamp: new Date(),
          comment: 'Workflow initiated - transcription completed'
        }],
        createdAt: new Date()
      });
      
      const savedTranscription = await transcription.save();
      console.log('🔄 Workflow created with ID:', savedTranscription._id);
      
      // Simulate asynchronous progression to review after 2 seconds
      setTimeout(() => {
        this.autoProgressWorkflow(savedTranscription._id.toString());
      }, 2000);
      
      return this.formatWorkflowResponse(savedTranscription);
      
    } catch (error) {
      console.error('❌ Error creating workflow:', error);
      throw error;
    }
  }

  /**
   * Manually transition workflow to next state
   */
  async transitionWorkflow(request: WorkflowTransitionRequest): Promise<WorkflowStatusResponse> {
    try {
      const transcription = await Transcription.findById(request.transcriptionId);
      
      if (!transcription) {
        throw new Error('Transcription not found');
      }
      
      if (!transcription.workflowStatus) {
        throw new Error('No workflow status found for this transcription');
      }
      
      // Validate transition
      const validNextStates = this.validTransitions[transcription.workflowStatus];
      if (!validNextStates.includes(request.newStatus)) {
        throw new Error(
          `Invalid transition from ${transcription.workflowStatus} to ${request.newStatus}. ` +
          `Valid transitions: ${validNextStates.join(', ')}`
        );
      }
      
      // Update workflow status and history
      transcription.workflowStatus = request.newStatus;
      transcription.updatedAt = new Date();
      
      if (!transcription.workflowHistory) {
        transcription.workflowHistory = [];
      }
      
      transcription.workflowHistory.push({
        status: request.newStatus,
        timestamp: new Date(),
        comment: request.comment,
        reviewedBy: request.reviewedBy
      });
      
      await transcription.save();
      
      console.log(`🔄 Workflow ${request.transcriptionId} transitioned to ${request.newStatus}`);
      
      // Auto-progress certain states asynchronously
      if (request.newStatus === 'review') {
        setTimeout(() => {
          this.autoProgressWorkflow(request.transcriptionId);
        }, 3000); // Auto-progress to approval after 3 seconds
      } else if (request.newStatus === 'approval') {
        setTimeout(() => {
          this.autoProgressWorkflow(request.transcriptionId);
        }, 5000); // Auto-complete after 5 seconds
      }
      
      return this.formatWorkflowResponse(transcription);
      
    } catch (error) {
      console.error('❌ Error transitioning workflow:', error);
      throw error;
    }
  }

  /**
   * Get workflow status by transcription ID
   */
  async getWorkflowStatus(transcriptionId: string): Promise<WorkflowStatusResponse> {
    try {
      const transcription = await Transcription.findById(transcriptionId);
      
      if (!transcription) {
        throw new Error('Transcription not found');
      }
      
      return this.formatWorkflowResponse(transcription);
      
    } catch (error) {
      console.error('❌ Error getting workflow status:', error);
      throw error;
    }
  }

  /**
   * List all workflows with optional status filter
   */
  async listWorkflows(
    status?: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<WorkflowListResponse> {
    try {
      const query: any = { workflowStatus: { $exists: true } };
      
      if (status) {
        query.workflowStatus = status;
      }
      
      const skip = (page - 1) * limit;
      
      const [workflows, total] = await Promise.all([
        Transcription.find(query)
          .sort({ updatedAt: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Transcription.countDocuments(query)
      ]);
      
      console.log(`📊 Found ${workflows.length} workflows (status: ${status || 'all'})`);
      
      return {
        workflows: workflows as ITranscription[],
        total,
        page,
        limit
      };
      
    } catch (error) {
      console.error('❌ Error listing workflows:', error);
      throw error;
    }
  }

  /**
   * Get workflow statistics
   */
  async getWorkflowStats(): Promise<Record<string, number>> {
    try {
      const stats = await Transcription.aggregate([
        { $match: { workflowStatus: { $exists: true } } },
        { $group: { _id: '$workflowStatus', count: { $sum: 1 } } }
      ]);
      
      const result: Record<string, number> = {
        transcription: 0,
        review: 0,
        approval: 0,
        completed: 0,
        rejected: 0
      };
      
      stats.forEach(stat => {
        result[stat._id] = stat.count;
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error getting workflow stats:', error);
      throw error;
    }
  }

  /**
   * Private method for auto-progressing workflows
   */
  private async autoProgressWorkflow(transcriptionId: string): Promise<void> {
    try {
      const transcription = await Transcription.findById(transcriptionId);
      
      if (!transcription || !transcription.workflowStatus) {
        return;
      }
      
      let nextStatus: string | null = null;
      let comment = '';
      
      switch (transcription.workflowStatus) {
        case 'transcription':
          nextStatus = 'review';
          comment = 'Auto-progressed to review phase';
          break;
        case 'review':
          nextStatus = 'approval';
          comment = 'Auto-progressed to approval phase';
          break;
        case 'approval':
          nextStatus = 'completed';
          comment = 'Auto-completed workflow';
          break;
        default:
          return; // No auto-progression needed
      }
      
      if (nextStatus) {
        await this.transitionWorkflow({
          transcriptionId: transcriptionId,
          newStatus: nextStatus as any,
          comment: comment,
          reviewedBy: 'system'
        });
      }
      
    } catch (error) {
      console.error('❌ Error in auto-progression:', error);
      // Don't throw error to avoid breaking the main workflow
    }
  }

  /**
   * Format workflow response
   */
  private formatWorkflowResponse(transcription: ITranscription): WorkflowStatusResponse {
    const currentStatus = transcription.workflowStatus || 'transcription';
    const canTransition = this.validTransitions[currentStatus] || [];
    
    return {
      id: transcription._id.toString(),
      currentStatus,
      workflowHistory: transcription.workflowHistory || [],
      canTransition
    };
  }

  /**
   * Mock audio download (reused from TranscriptionService)
   */
  private async mockAudioDownload(audioUrl: string): Promise<void> {
    console.log(`🎵 Mocking audio download from: ${audioUrl}`);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (Math.random() < 0.02) { // Lower failure rate for workflows
      throw new Error('Audio download failed - network timeout');
    }
    
    console.log('✅ Audio download completed successfully');
  }

  /**
   * Generate mock transcription text (reused from TranscriptionService)
   */
  private generateMockTranscription(language: string = 'en-US'): string {
    const mockTranscriptions: Record<string, string[]> = {
      'en-US': [
        "This workflow demonstrates transcription processing with review and approval stages.",
        "Audio content processed through automated workflow system for quality assurance.",
        "Transcription workflow includes multiple validation steps for accuracy.",
        "Sample audio processed through comprehensive review pipeline."
      ],
      'fr-FR': [
        "Ce flux de travail démontre le traitement de transcription avec des étapes de révision et d'approbation.",
        "Contenu audio traité via un système de flux de travail automatisé pour l'assurance qualité."
      ],
      'es-ES': [
        "Este flujo de trabajo demuestra el procesamiento de transcripción con etapas de revisión y aprobación.",
        "Contenido de audio procesado a través de un sistema de flujo de trabajo automatizado para control de calidad."
      ]
    };
    
    const transcriptions = mockTranscriptions[language] || mockTranscriptions['en-US'];
    return transcriptions[Math.floor(Math.random() * transcriptions.length)];
  }
}
