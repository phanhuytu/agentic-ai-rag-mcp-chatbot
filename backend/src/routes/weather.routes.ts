import { Router } from 'express';
import { getWeather } from '../controllers/weather.controller.js';

export const weatherRouter = Router();

weatherRouter.get('/', getWeather);
