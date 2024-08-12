import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET_KEY } from 'constants/constants';
import RedisService from '@common/utils/RedisService';

const router = Router();

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'username and password are required' });
    }

    // const user = users[username];

    // if (!user) {
    //     return res.status(400).json({ message: 'invalid username or password' });
    // }

    // const isPasswordValid = await bcrypt.compare(password, user.password);

    // if (!isPasswordValid) {
    //     return res.status(400).json({ message: 'Invalid username or password' });
    // }

    const token = jwt.sign({ userId: username }, JWT_SECRET_KEY, { expiresIn: '1d' });

    res.status(200).json({ token });
});

export default router;
