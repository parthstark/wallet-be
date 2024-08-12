import { Request, Response, NextFunction } from 'express';
import axios, { isAxiosError } from 'axios';

const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const response = await authorizeUser(req);
        req.body.userId = response.userId;
        next();
    } catch (error) {
        if (isAxiosError(error) && error.response) {
            return res.status(401).json({ message: error.response?.data.message });
        } else {
            return res.status(500).json({ message: 'internal Server Error' });
        }
    }
};

const authorizeUser = async (req: Request): Promise<any> => {
    const response = await axios.post('http://localhost:3001/api/v1/authorize', {}, {
        headers: {
            Authorization: req.headers.authorization
        }
    });
    return response.data;
};

export default authMiddleware