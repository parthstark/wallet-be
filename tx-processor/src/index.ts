import { TransactionStatus } from '@common/types/transaction';
import RedisService from '@common/utils/RedisService';

async function processTransaction() {
    const redisService = await RedisService.getInstance();

    while (true) {
        try {
            const transactionRequest = await redisService.popTransactionPreProcessorQueue()
            const { transactionId, senderId, recipientId, amountInPaise } = transactionRequest
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
                    ...transactionRequest,
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
