import { Router } from 'express';
import { WorkflowController } from '../controllers/workflow.controller';

const router = Router();
const workflowController = new WorkflowController();

/**
 * Workflow Management Routes
 */

// Create a new workflow
router.post('/workflow', workflowController.createWorkflow);

// Transition workflow to next state
router.put('/workflow/:id/transition', workflowController.transitionWorkflow);

// Get workflow status by ID
router.get('/workflow/:id', workflowController.getWorkflowStatus);

// List all workflows with optional filtering
router.get('/workflows', workflowController.listWorkflows);

// Get workflow statistics
router.get('/workflow/stats', workflowController.getWorkflowStats);

export default router;
