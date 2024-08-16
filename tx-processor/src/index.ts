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
            const doesRecipientIdExists = await redisService.existsInBalanceStore(recipientId)

            const [senderBalanceInPaise, recipientBalanceInPaise] = await Promise.all([
                redisService.getBalance(senderId),
                redisService.getBalance(recipientId)
            ])

            let transactionStatus: TransactionStatus | undefined
            let timestamp: number | undefined

            if (doesRecipientIdExists && senderBalanceInPaise >= amountInPaise) {
                const newSenderBalanceInPaise = senderBalanceInPaise - amountInPaise;
                const newRecipientBalanceInPaise = recipientBalanceInPaise + amountInPaise;
                timestamp = new Date().getTime()
                transactionStatus = 'SUCCESS';

                await redisService.updateRedisStoreUserBalances({
                    senderId,
                    newSenderBalanceInPaise,
                    recipientId,
                    newRecipientBalanceInPaise
                })

                await redisService.pushTransactionPreDBWriterQueue({
                    ...transactionRequest,
                    newSenderBalanceInPaise,
                    newRecipientBalanceInPaise,
                    timestamp
                })
            }

            if (!timestamp || !transactionStatus) {
                timestamp = new Date().getTime()
                transactionStatus = 'FAILURE'
            }
            await redisService.publishTransactionStatus({ transactionId, transactionStatus, timestamp })

        } catch (error) {
            console.error('error processing transaction:', error);
        }
    }
}

processTransaction().catch(console.error);
