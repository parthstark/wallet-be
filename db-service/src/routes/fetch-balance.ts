import RedisService from '@common/utils/RedisService';
import { Router } from 'express';

const router = Router();

router.post('/fetch-balance', async (req, res) => {
    const { userId } = req.body
    try {
        const redisService = await RedisService.getInstance();
        const balance = await redisService.getBalance(userId as string);

        return res.json({ balance });
    } catch (err) {
        console.error('error fetching balance:', err);
        return res.status(500).json({ message: 'internal Server Error' });
    }
});

export default router;
