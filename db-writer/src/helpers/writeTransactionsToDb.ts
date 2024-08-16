import { PrismaClient } from '@prisma/client';
import RedisService from '@common/utils/RedisService';

const prisma = new PrismaClient();

async function writeTransactionsToDb() {
    const redisService = await RedisService.getInstance();

    while (true) {
        try {
            const executedTransaction = await redisService.popTransactionPreDBWriterQueue();

            const { transactionId, senderId, recipientId, amountInPaise, newSenderBalanceInPaise, newRecipientBalanceInPaise, timestamp } = executedTransaction;
            if (!transactionId) {
                continue
            }

            await Promise.all([
                // Store the sender's transaction (negative amount)
                prisma.transaction.create({
                    data: {
                        transactionId,
                        amountInPaise: -amountInPaise,
                        userBalanceAfterTransaction: newSenderBalanceInPaise,
                        debitorId: senderId,
                        creditorId: recipientId,
                        timestamp: new Date(timestamp)
                    },
                }),

                prisma.user.update({
                    where: { userId: senderId },
                    data: { balanceInPaise: newSenderBalanceInPaise },
                }),

                // Store the recipient's transaction (positive amount)
                prisma.transaction.create({
                    data: {
                        transactionId,
                        amountInPaise,
                        userBalanceAfterTransaction: newRecipientBalanceInPaise,
                        debitorId: senderId,
                        creditorId: recipientId,
                        timestamp: new Date(timestamp)
                    },
                }),

                prisma.user.update({
                    where: { userId: recipientId },
                    data: { balanceInPaise: newRecipientBalanceInPaise },
                }),
            ])

        } catch (err) {
            console.error('error processing transaction:', err);
        }
    }
}

export default writeTransactionsToDb