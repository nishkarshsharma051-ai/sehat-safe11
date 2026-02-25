import { Request, Response } from 'express';
import Affiliate from '../models/Affiliate';

export const affiliateController = {
    async getAll(req: Request, res: Response) {
        try {
            const { type, query, lat, lng, radius = 25000 } = req.query;
            const filter: any = {};
            if (type) filter.type = type;
            if (query) {
                filter.$or = [
                    { name: { $regex: query as string, $options: 'i' } },
                    { services: { $regex: query as string, $options: 'i' } }
                ];
            }

            if (lat && lng) {
                const parsedLat = parseFloat(lat as string);
                const parsedLng = parseFloat(lng as string);
                const parsedRadius = parseInt(radius as string);

                if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
                    filter.location = {
                        $near: {
                            $geometry: {
                                type: 'Point',
                                coordinates: [parsedLng, parsedLat]
                            },
                            $maxDistance: isNaN(parsedRadius) ? 25000 : parsedRadius
                        }
                    };
                }
            }

            const affiliates = await Affiliate.find(filter);
            res.json(affiliates);
        } catch (error: any) {
            console.error('Affiliate Fetch Error:', error);
            res.status(500).json({ message: error.message });
        }
    },

    async getById(req: Request, res: Response) {
        try {
            const affiliate = await Affiliate.findById(req.params.id);
            if (!affiliate) return res.status(404).json({ message: 'Affiliate not found' });
            res.json(affiliate);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    },

    async create(req: Request, res: Response) {
        try {
            const affiliate = new Affiliate(req.body);
            await affiliate.save();
            res.status(201).json(affiliate);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
};
