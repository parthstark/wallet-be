import RedisService from './service/RedisService';
import { TransactionStatus } from './types/transaction';

async function processTransaction() {
    const redisService = await RedisService.getInstance();

    while (true) {
        try {
            const { transactionId, senderId, recipientId, amountInPaise } = await redisService.popTransactionPreProcessorQueue()
            if (!transactionId) {
                continue
            }

            const { senderBalanceInPaise, recipientBalanceInPaise } = await redisService.fetchBalance({ senderId, recipientId })
            let transactionStatus: TransactionStatus = 'FAILURE';

            if (senderBalanceInPaise >= amountInPaise) {
                const newSenderBalanceInPaise = senderBalanceInPaise - amountInPaise;
                const newRecipientBalanceInPaise = recipientBalanceInPaise + amountInPaise;

                await redisService.updateRedisStoreUserBalances({
                    senderId,
                    newSenderBalanceInPaise,
                    recipientId,
                    newRecipientBalanceInPaise
                })
                transactionStatus = 'SUCCESS';

                await redisService.pushTransactionPreDBWriterQueue({
                    transactionId,
                    senderId,
                    recipientId,
                    amountInPaise,
                    newSenderBalanceInPaise,
                    newRecipientBalanceInPaise,
                })
            }

            await redisService.publishTransactionStatus({ transactionId, transactionStatus })

        } catch (error) {
            console.error('error processing transaction:', error);
        }
    }
}

processTransaction().catch(console.error);
