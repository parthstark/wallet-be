import axios, { isAxiosError } from 'axios';
import { Router } from 'express';
import authMiddleware from 'middlewares/authMiddleware';

const router = Router();

router.post('/fetch-transactions', authMiddleware, async (req, res) => {
    const { userId } = req.body

    try {
        const transactions = await fetchUserTransactions(userId);
        return res.json({
            userId,
            transactions
        });
    } catch (error) {
        if (isAxiosError(error) && error.response) {
            return res.status(401).json({ message: error.response?.data.message });
        } else {
            return res.status(500).json({ message: 'internal Server Error' });
        }
    }
});

const fetchUserTransactions = async (userId: string): Promise<any> => {
    const response = await axios.post('http://localhost:3002/api/v1/fetch-transactions', {
        userId
    });
    return response.data.transactions;
};

export default router;
