import { JWT_SECRET_KEY } from 'constants/constants';
import { Router } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const router = Router();

router.post('/authorize', async (req, res) => {
    const authToken = req.headers.authorization;

    if (!authToken) {
        return res.status(401).json({ message: 'authorization header missing' });
    }

    try {
        const decoded = jwt.verify(authToken, JWT_SECRET_KEY) as JwtPayload;
        const { userId } = decoded;
        res.status(200).json({ userId });
    } catch (error) {
        res.status(401).json({ message: 'invalid token' });
    }
});

export default router;
