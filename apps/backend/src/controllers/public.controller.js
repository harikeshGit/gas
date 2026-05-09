import { Dealer } from '../models/Dealer.js';
import { z } from 'zod';

export async function listDealers(_req, res, next) {
    try {
        const dealers = await Dealer.find({ isActive: true }).select('businessName isActive').sort({ createdAt: -1 }).limit(50);
        return res.json({ dealers });
    } catch (err) {
        return next(err);
    }
}

const geocodeSchema = z.object({
    q: z.string().min(3),
});

export async function geocode(req, res, next) {
    try {
        const { q } = geocodeSchema.parse(req.query);

        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
        const r = await fetch(url, {
            headers: {
                'User-Agent': 'cylendra-wala-demo/0.1 (education project)',
            },
        });

        if (!r.ok) {
            return res.status(502).json({ error: 'Geocoding service failed' });
        }

        const json = await r.json();
        const first = json?.[0];
        if (!first?.lat || !first?.lon) {
            return res.status(404).json({ error: 'Address not found' });
        }

        return res.json({
            location: { lat: Number(first.lat), lng: Number(first.lon) },
            displayName: first.display_name,
        });
    } catch (err) {
        if (err?.name === 'ZodError') {
            return res.status(400).json({ error: 'Validation failed', details: err.errors });
        }
        return next(err);
    }
}

const reverseGeocodeSchema = z.object({
    lat: z.coerce.number(),
    lng: z.coerce.number(),
});

export async function reverseGeocode(req, res, next) {
    try {
        const { lat, lng } = reverseGeocodeSchema.parse(req.query);

        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
            String(lat)
        )}&lon=${encodeURIComponent(String(lng))}`;

        const r = await fetch(url, {
            headers: {
                'User-Agent': 'cylendra-wala-demo/0.1 (education project)',
            },
        });

        if (!r.ok) {
            return res.status(502).json({ error: 'Reverse geocoding service failed' });
        }

        const json = await r.json();
        const displayName = json?.display_name;
        if (!displayName) {
            return res.status(404).json({ error: 'Address not found for this location' });
        }

        return res.json({
            address: displayName,
            location: { lat: Number(lat), lng: Number(lng) },
        });
    } catch (err) {
        if (err?.name === 'ZodError') {
            return res.status(400).json({ error: 'Validation failed', details: err.errors });
        }
        return next(err);
    }
}
