import { Request, Response, NextFunction } from 'express';

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: 'authorization header missing' });
    }

    try {
        const userId = extractUserIdFromToken(authHeader);
        req.body.userId = userId;

        next();
    } catch (error) {
        return res.status(401).json({ message: 'unauthorized request' });
    }
};

const extractUserIdFromToken = (token: string): string => {
    // Assuming the token is a JWT and the userId is stored in the payload
    // Replace this with your actual token decoding logic
    return token; // Replace with actual userId extraction
};

export default authMiddleware