import { Router } from 'express';
import { geocode, listDealers, reverseGeocode } from '../controllers/public.controller.js';

export const publicRoutes = Router();

publicRoutes.get('/dealers', listDealers);
publicRoutes.get('/geocode', geocode);
publicRoutes.get('/reverse-geocode', reverseGeocode);
