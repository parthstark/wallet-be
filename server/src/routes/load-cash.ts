import { Router } from 'express';
import dotenv from 'dotenv';
import RedisService from '@common/utils/RedisService';
import authMiddleware from 'middlewares/authMiddleware';

const router = Router();

dotenv.config();

const LOAD_CASH_PASSWORD = process.env.LOAD_CASH_PASSWORD

router.post('/load-cash', authMiddleware, async (req, res) => {
    const { userId, cashInPaise, password } = req.body

    if (!password || !cashInPaise || password !== LOAD_CASH_PASSWORD) {
        return res.status(400).json({
            message: 'bad request'
        })
    }

    const loadedCashInPaise = parseInt(cashInPaise || '0', 10)
    const redisService = await RedisService.getInstance();
    const existingBalanceInPaise = await redisService.getBalance(userId)
    await redisService.setBalance({ userId, balanceInPaise: existingBalanceInPaise + loadedCashInPaise })

    return res.json({
        userId,
        balanceInPaise: existingBalanceInPaise + loadedCashInPaise
    });
});

export default router;
