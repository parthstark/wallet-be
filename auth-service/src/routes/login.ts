import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { JWT_SECRET_KEY } from 'constants/constants';
import RedisService from '@common/utils/RedisService';

const router = Router();

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'username and password are required' });
    }

    const redisService = await RedisService.getInstance();
    const savedHashedPassword = await redisService.getUserHashedPassword({ username })
    if (!savedHashedPassword) {
        return res.status(400).json({ message: 'invalid username or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, savedHashedPassword);
    if (!isPasswordValid) {
        return res.status(400).json({ message: 'invalid username or password' });
    }

    const token = jwt.sign({ userId: username }, JWT_SECRET_KEY, { expiresIn: '1d' });

    res.status(200).json({ token });
});

export default router;
