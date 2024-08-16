import axios, { isAxiosError } from 'axios';
import { Request, Router } from 'express';

const router = Router();

router.post('/signup', async (req, res) => {
    try {
        const response = await signupUser(req);
        return res.json(response);
    } catch (error) {
        if (isAxiosError(error) && error.response) {
            return res.status(401).json({ message: error.response?.data.message });
        } else {
            return res.status(500).json({ message: 'internal Server Error' });
        }
    }
});

const signupUser = async (req: Request): Promise<any> => {
    const response = await axios.post('http://auth-service:3001/api/v1/signup', {
        username: req?.body?.username,
        password: req?.body?.password,
    });
    return JSON.parse(JSON.stringify(response.data));
};

export default router;
