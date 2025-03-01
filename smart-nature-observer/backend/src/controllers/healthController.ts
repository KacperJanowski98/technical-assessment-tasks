import { Request, Response } from 'express';
import { ModelService } from '../services/ModelService';

export class HealthController {
  private modelService: ModelService;
  
  constructor(modelService: ModelService) {
    this.modelService = modelService;
  }
  
  // Check health of the API
  public checkHealth = async (req: Request, res: Response): Promise<void> => {
    try {
      // Check model health
      const modelHealth = await this.modelService.checkHealth();
      
      // Combine with API health
      const health = {
        api: {
          status: 'operational',
          timestamp: new Date().toISOString()
        },
        model: modelHealth,
        uptime: process.uptime()
      };
      
      // Determine overall status
      const overallStatus = modelHealth.status === 'operational' ? 200 : 
                           modelHealth.status === 'degraded' ? 200 : 503;
      
      res.status(overallStatus).json(health);
    } catch (error: any) {
      console.error('Error checking health:', error);
      
      res.status(500).json({
        api: {
          status: 'error',
          timestamp: new Date().toISOString()
        },
        model: {
          status: 'unavailable',
          message: `Health check failed: ${error?.message || 'Unknown error'}`
        },
        uptime: process.uptime()
      });
    }
  };
}