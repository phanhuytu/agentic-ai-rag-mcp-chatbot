import { Router } from 'express';
import { handleChat, handleChatStream } from '../controllers/chat.controller.js';

export const chatRouter = Router();

chatRouter.post('/', handleChat);
chatRouter.post('/stream', handleChatStream);
