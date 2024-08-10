import { Router, Request, Response } from 'express';
import RedisService from '../service/RedisService';

const router = Router();

router.post('/fetch-balance', async (req: Request, res: Response) => {
    const { accountId } = req.body

    if (!accountId) {
        res.status(400).json({
            message: "bad request"
        });
        return;
    }

    try {
        const redisService = await RedisService.getInstance();
        const balance = await redisService.getBalance(accountId as string);

        res.json({
            accountId,
            balance
        });
    } catch (err) {
        console.error('error fetching balance:', err);
        res.status(500).json({ message: 'internal Server Error' });
    }
});

export default router;
