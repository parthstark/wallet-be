import { TRANSACTION_PRE_PROCESSOR_QUEUE, TRANSACTION_PRE_DB_WRITER_QUEUE } from '../constants/constants'
import { createClient, RedisClientType } from 'redis';
import { TransactionStatus, TransactionRequest } from '../types/transaction';

interface fetchBalanceRequest { senderId: string, recipientId: string }
interface fetchBalanceResponse { senderBalanceInPaise: number, recipientBalanceInPaise: number }
interface updateRedisStoreUserBalancesRequest {
    senderId: string,
    newSenderBalanceInPaise: number,
    recipientId: string,
    newRecipientBalanceInPaise: number,
}
interface publishTransactionStatusRequest { transactionId: string, transactionStatus: TransactionStatus }
interface pushTransactionPreDBWriterQueueRequest {
    transactionId: string,
    senderId: string,
    recipientId: string,
    amountInPaise: number,
    newSenderBalanceInPaise: number,
    newRecipientBalanceInPaise: number,
}

class RedisService {
    private static instance: RedisService;
    private redisClient: RedisClientType;
    private pubsubClient: RedisClientType;

    private constructor() {
        this.redisClient = createClient();
        this.pubsubClient = createClient();

        this.redisClient.on('error', (err) => {
            console.error('redis error:', err);
        });

        this.pubsubClient.on('error', (err) => {
            console.error('redis pubsub error:', err);
        });
    }

    public static async getInstance(): Promise<RedisService> {
        if (!RedisService.instance) {
            const service = new RedisService();
            await service.redisClient.connect();
            await service.pubsubClient.connect();
            RedisService.instance = service;
        }
        return RedisService.instance;
    }

    public async pushTransactionPreProcessorQueue(transactionRequest: TransactionRequest): Promise<void> {
        await this.redisClient.rPush(TRANSACTION_PRE_PROCESSOR_QUEUE, JSON.stringify(transactionRequest));
    }

    public async popTransactionPreProcessorQueue(): Promise<TransactionRequest> {
        const { element } = await this.redisClient.blPop(TRANSACTION_PRE_PROCESSOR_QUEUE, 0) ?? {};

        if (!element) {
            const emptyTransaction: TransactionRequest = {
                transactionId: '',
                senderId: '',
                recipientId: '',
                amountInPaise: 0
            }
            return emptyTransaction
        }
        const transaction: TransactionRequest = JSON.parse(element);
        return transaction
    }

    public async fetchBalance({ senderId, recipientId }: fetchBalanceRequest): Promise<fetchBalanceResponse> {
        const senderBalanceKey = `balance:${senderId}`;
        const recipientBalanceKey = `balance:${recipientId}`;

        const [senderBalanceString, recipientBalanceString] = await this.redisClient.mGet([senderBalanceKey, recipientBalanceKey]);

        const senderBalanceInPaise = parseInt(senderBalanceString || '0', 10);
        const recipientBalanceInPaise = parseInt(recipientBalanceString || '0', 10);

        return { senderBalanceInPaise, recipientBalanceInPaise }
    }

    public async updateRedisStoreUserBalances({
        senderId,
        newSenderBalanceInPaise,
        recipientId,
        newRecipientBalanceInPaise
    }: updateRedisStoreUserBalancesRequest): Promise<void> {
        const senderBalanceKey = `balance:${senderId}`;
        const recipientBalanceKey = `balance:${recipientId}`;

        const multi = this.redisClient.multi();
        multi.set(senderBalanceKey, newSenderBalanceInPaise);
        multi.set(recipientBalanceKey, newRecipientBalanceInPaise);
        await multi.exec();
    }

    public async publishTransactionStatus({ transactionId, transactionStatus }: publishTransactionStatusRequest): Promise<void> {
        const pubsubChannel = `transaction:${transactionId}`;
        const pubsubMessage = JSON.stringify({
            transactionStatus,
            timestamp: new Date().getTime(),
        })
        await this.pubsubClient.publish(pubsubChannel, pubsubMessage);
    }

    public subscribeToTransaction(transactionId: string, callback: (message: string) => void): void {
        const pubsubChannel = `transaction:${transactionId}`;
        this.pubsubClient.subscribe(pubsubChannel, callback);
    }

    public async pushTransactionPreDBWriterQueue(transactionDBData: pushTransactionPreDBWriterQueueRequest): Promise<void> {
        await this.redisClient.rPush(TRANSACTION_PRE_DB_WRITER_QUEUE, JSON.stringify(transactionDBData));
    }

    public getBalance(accountId: string): Promise<number> {
        return new Promise(resolve => resolve(1236700))
    }
}

export default RedisService;
