import axios, { isAxiosError } from 'axios';
import { Router } from 'express';
import authMiddleware from 'middlewares/authMiddleware';

const router = Router();

router.post('/fetch-balance', authMiddleware, async (req, res) => {
    const { userId } = req.body

    try {
        const balance = await fetchUserBalance(userId);
        return res.json({
            userId,
            balance
        });
    } catch (error) {
        if (isAxiosError(error) && error.response) {
            return res.status(401).json({ message: error.response?.data.message });
        } else {
            return res.status(500).json({ message: 'internal Server Error' });
        }
    }
});

const fetchUserBalance = async (userId: string): Promise<any> => {
    const response = await axios.post('http://db-service:3002/api/v1/fetch-balance', {
        userId
    });
    return response.data.balance;
};

export default router;
