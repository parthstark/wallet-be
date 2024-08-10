import { Router, Request, Response } from 'express';
import RedisService from '@common/utils/RedisService';

const router = Router();

router.post('/fetch-balance', async (req: Request, res: Response) => {
    const { userId } = req.body

    if (!userId) {
        res.status(400).json({
            message: "bad request"
        });
        return;
    }

    try {
        const redisService = await RedisService.getInstance();
        const balance = await redisService.getBalance(userId as string);

        res.json({
            userId,
            balance
        });
    } catch (err) {
        console.error('error fetching balance:', err);
        res.status(500).json({ message: 'internal Server Error' });
    }
});

export default router;
