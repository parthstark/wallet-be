import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import RedisService from '@common/utils/RedisService';
import { BCRYPT_SALT_ROUNDS_COUNT, JWT_SECRET_KEY } from 'constants/constants';

const router = Router();

router.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'username and password are required' });
    }

    const redisService = await RedisService.getInstance();

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS_COUNT);
    const { alreadyExists } = await redisService.signupUser({ username, hashedPassword })
    if (alreadyExists) {
        return res.status(400).json({ message: 'user already exists' });
    }

    await redisService.pushSignupUserQueue({ username, hashedPassword })

    const token = jwt.sign({ userId: username }, JWT_SECRET_KEY, { expiresIn: '1d' });

    res.status(200).json({ token });
});

export default router;
