import RedisService from './service/RedisService';
import { TransactionStatus } from './types/transaction';

async function processTransaction() {
    const redisService = await RedisService.getInstance();

    while (true) {
        try {
            const { transactionId, senderId, recipientId, amountInPaise } = await redisService.popTransaction()
            if (!transactionId) {
                continue
            }

            const { senderBalance, recipientBalance } = await redisService.fetchBalance({ senderId, recipientId })
            let transactionStatus: TransactionStatus = 'FAILURE';

            if (senderBalance >= amountInPaise) {
                const newSenderBalance = senderBalance - amountInPaise;
                const newRecipientBalance = recipientBalance + amountInPaise;

                await redisService.updateBalance({
                    senderId,
                    newSenderBalance,
                    recipientId,
                    newRecipientBalance
                })
                transactionStatus = 'SUCCESS';
            }

            await redisService.publishTransactionStatus({ transactionId, transactionStatus })

        } catch (error) {
            console.error('error processing transaction:', error);
        }
    }
}

processTransaction().catch(console.error);
