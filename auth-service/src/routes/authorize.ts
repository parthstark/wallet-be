import RedisService from '@common/utils/RedisService';
import { JWT_SECRET_KEY } from 'constants/constants';
import { Router } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const router = Router();

router.post('/authorize', async (req, res) => {
    const authToken = req.headers.authorization;

    if (!authToken) {
        return res.status(401).json({ message: 'authorization header missing' });
    }

    const redisService = await RedisService.getInstance();

    try {
        const decoded = jwt.verify(authToken, JWT_SECRET_KEY) as JwtPayload;
        const { userId } = decoded;

        const savedHashedPassword = await redisService.getUserHashedPassword({ username: userId })
        if (!savedHashedPassword) {
            throw new Error("user not found");
        }

        return res.status(200).json({ userId });
    } catch (error) {
        return res.status(401).json({ message: 'invalid authorization token' });
    }
});

export default router;
