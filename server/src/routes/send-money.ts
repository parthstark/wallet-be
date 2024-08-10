import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import RedisService from '@common/utils/RedisService';
import { TransactionRequest } from '@common/types/transaction';

const router = Router();

router.post('/send-money', async (req, res) => {
    const { userId, recipientId, amountInPaise } = req.body
    if (!userId || !recipientId || !amountInPaise) {
        res.status(400).json({
            message: "bad request"
        })
        return
    }
    console.log(`handling request for ${userId}`);

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

        redisService.subscribeToTransaction(transactionId, (message) => {
            const { transactionStatus, timestamp } = JSON.parse(message)
            res.json({
                transactionId,
                transactionStatus,
                timestamp,
            });
        })
    } catch (err) {
        console.error('error processing transaction:', err);
        res.status(500).json({ message: 'internal server error' });
    }
})

export default router;