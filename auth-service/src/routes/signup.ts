import { Router } from 'express';
import jwt from 'jsonwebtoken';
import RedisService from '@common/utils/RedisService';

const router = Router();
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || ''

router.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'username and password are required' });
    }

    // if (users[username]) {
    //     return res.status(400).json({ message: 'User already exists' });
    // }

    // const hashedPassword = await bcrypt.hash(password, 10);
    // const userId = `user_${Date.now()}`;

    // // Store the user in the "database"
    // users[username] = { password: hashedPassword, userId };

    const token = jwt.sign({ userId: username }, JWT_SECRET_KEY, { expiresIn: '1d' });

    res.status(200).json({ token });
});

export default router;
