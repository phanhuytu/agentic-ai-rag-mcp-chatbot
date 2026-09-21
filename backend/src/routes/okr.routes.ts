import { Router } from 'express';
import {
  getPlaybookSection,
  invokeTool,
  listOkrTools,
  listPlaybookSections,
  validateOkr,
} from '../controllers/okr.controller.js';

export const okrRouter = Router();

okrRouter.get('/tools', listOkrTools);
okrRouter.post('/validate', validateOkr);
okrRouter.get('/playbook/sections', listPlaybookSections);
okrRouter.get('/playbook/section', getPlaybookSection);
okrRouter.post('/tools/:name', invokeTool);
