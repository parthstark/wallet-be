import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import RedisService from '@common/utils/RedisService';
import { TransactionRequest } from '@common/types/transaction';
import authMiddleware from 'middlewares/authMiddleware';

const TRANSACTION_TIMEOUT = 10000; // 10 seconds

const router = Router();

router.post('/send-money', authMiddleware, async (req, res) => {
    const { userId, recipientId, amountInPaise } = req.body

    if (!recipientId || !amountInPaise) {
        return res.status(400).json({
            message: "bad request"
        })
    }

    const transactionId = uuidv4()
    const transactionRequest: TransactionRequest = {
        transactionId,
        senderId: userId,
        recipientId,
        amountInPaise,
    };

    try {
        const redisService = await RedisService.getInstance();

        await redisService.pushTransactionPreProcessorQueue(transactionRequest);

        // Start a timer for 30 seconds
        const timer = setTimeout(() => {
            return res.json({
                transactionId,
                transactionStatus: 'PENDING'
            });
        }, TRANSACTION_TIMEOUT);

        redisService.subscribeToTransaction(transactionId, (message) => {
            clearTimeout(timer);

            const { transactionStatus, timestamp } = JSON.parse(message)
            return res.json({
                transactionId,
                transactionStatus,
                timestamp,
            });
        })
    } catch (err) {
        console.error('error processing transaction:', err);
        return res.status(500).json({ message: 'internal server error' });
    }
})

export default router;