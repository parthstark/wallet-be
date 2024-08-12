import { Router } from 'express';
import RedisService from '@common/utils/RedisService';
import authMiddleware from 'middlewares/authMiddleware';

const router = Router();

router.post('/fetch-balance', authMiddleware, async (req, res) => {
    const { userId } = req.body

    if (!userId) {
        return res.status(400).json({
            message: "bad request"
        });
    }

    try {
        const redisService = await RedisService.getInstance();
        const balance = await redisService.getBalance(userId as string);

        return res.json({
            userId,
            balance
        });
    } catch (err) {
        console.error('error fetching balance:', err);
        return res.status(500).json({ message: 'internal Server Error' });
    }
});

export default router;
