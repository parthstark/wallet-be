import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { TransactionRequest } from '../types/transaction';
import RedisService from '../service/RedisService';

const router = Router();

router.post('/send-money', async (req, res) => {
    const { senderId, recipientId, amountInPaise } = req.body
    if (!senderId || !recipientId || !amountInPaise) {
        res.status(400).json({
            message: "bad request"
        })
        return
    }

    const transactionId = uuidv4()
    const transactionRequest: TransactionRequest = {
        transactionId,
        senderId,
        recipientId,
        amountInPaise,
    };

    try {
        const redisService = await RedisService.getInstance();

        await redisService.pushTransactionToQueue(transactionRequest);

        res.json({
            transactionId,
            message: "processing"
        });
    } catch (err) {
        console.error('error processing transaction:', err);
        res.status(500).json({ message: 'internal server error' });
    }
})

export default router;