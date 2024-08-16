import { PrismaClient } from '@prisma/client';
import { Router } from 'express';

const router = Router();
const prisma = new PrismaClient();

router.post('/fetch-transactions', async (req, res) => {
    const { userId } = req.body
    try {
        const result = await prisma.user.findUnique({
            where: {
                userId,
            },
            include: {
                creditTransactions: true,
                debitTransactions: true
            }
        })

        const allTransactions = [
            ...(result?.creditTransactions || []),
            ...(result?.debitTransactions || []),
        ];

        return res.json({ transactions: allTransactions });

    } catch (err) {
        return res.status(500).json({ message: 'internal Server Error' });
    }
});

export default router;
