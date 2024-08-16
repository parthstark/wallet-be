import { TRANSACTION_PRE_PROCESSOR_QUEUE, TRANSACTION_PRE_DB_WRITER_QUEUE, SIGNUP_USER_QUEUE } from '../constants/constants'
import { createClient, RedisClientType } from 'redis';
import { TransactionRequest } from '../types/transaction';
import {
    updateRedisStoreUserBalancesRequest,
    publishTransactionStatusRequest,
    setBalanceRequest,
    userRequest,
    signupUserResponse,
    getUserHashedPasswordRequest,
    ExecutedTransaction
} from 'types/redis-service';

class RedisService {
    private static instance: RedisService;
    private redisStoreClient: RedisClientType;
    private redisQueueClient: RedisClientType;
    private redisPubSubClient: RedisClientType;

    private constructor() {
        this.redisStoreClient = createClient();
        this.redisQueueClient = createClient();
        this.redisPubSubClient = createClient();

        this.redisStoreClient.on('error', (err) => {
            console.error('redis error:', err);
        });

        this.redisQueueClient.on('error', (err) => {
            console.error('redis error:', err);
        });

        this.redisPubSubClient.on('error', (err) => {
            console.error('redis pubsub error:', err);
        });
    }

    public static async getInstance(): Promise<RedisService> {
        if (!RedisService.instance) {
            const service = new RedisService();
            await service.redisStoreClient.connect();
            await service.redisQueueClient.connect();
            await service.redisPubSubClient.connect();
            RedisService.instance = service;
        }
        return RedisService.instance;
    }

    public async pushTransactionPreProcessorQueue(transactionRequest: TransactionRequest): Promise<void> {
        await this.redisQueueClient.rPush(TRANSACTION_PRE_PROCESSOR_QUEUE, JSON.stringify(transactionRequest));
    }

    public async popTransactionPreProcessorQueue(): Promise<TransactionRequest> {
        const { element } = await this.redisQueueClient.blPop(TRANSACTION_PRE_PROCESSOR_QUEUE, 0) ?? {};
        if (!element) {
            return emptyTransaction
        }

        const transaction: TransactionRequest = JSON.parse(element);
        return transaction
    }

    public async updateRedisStoreUserBalances({
        senderId,
        newSenderBalanceInPaise,
        recipientId,
        newRecipientBalanceInPaise
    }: updateRedisStoreUserBalancesRequest): Promise<void> {
        const senderBalanceKey = `balance:${senderId}`;
        const recipientBalanceKey = `balance:${recipientId}`;

        const multi = this.redisStoreClient.multi();
        multi.set(senderBalanceKey, newSenderBalanceInPaise);
        multi.set(recipientBalanceKey, newRecipientBalanceInPaise);
        await multi.exec();
    }

    public async publishTransactionStatus({ transactionId, transactionStatus, timestamp }: publishTransactionStatusRequest): Promise<void> {
        const pubsubChannel = `transaction:${transactionId}`;
        const pubsubMessage = JSON.stringify({
            transactionStatus,
            timestamp,
        })
        await this.redisPubSubClient.publish(pubsubChannel, pubsubMessage);
    }

    public subscribeToTransaction(transactionId: string, callback: (message: string) => void): void {
        const pubsubChannel = `transaction:${transactionId}`;
        this.redisPubSubClient.subscribe(pubsubChannel, callback);
    }

    public async pushTransactionPreDBWriterQueue(transactionDBData: ExecutedTransaction): Promise<void> {
        await this.redisQueueClient.rPush(TRANSACTION_PRE_DB_WRITER_QUEUE, JSON.stringify(transactionDBData));
    }

    public async popTransactionPreDBWriterQueue(): Promise<ExecutedTransaction> {
        const { element } = await this.redisQueueClient.blPop(TRANSACTION_PRE_DB_WRITER_QUEUE, 0) ?? {};
        if (!element) {
            return emptyExecutedTransaction
        }

        const executedTransaction: ExecutedTransaction = JSON.parse(element);
        return executedTransaction
    }

    public async getBalance(userId: string): Promise<number> {
        const accountIdKey = `balance:${userId}`;
        const accountIdBalanceString = await this.redisStoreClient.get(accountIdKey);
        const accountIdBalanceInPaise = parseInt(accountIdBalanceString || '0', 10);
        return accountIdBalanceInPaise
    }

    public async setBalance({ userId, balanceInPaise }: setBalanceRequest): Promise<void> {
        const accountIdKey = `balance:${userId}`;
        await this.redisStoreClient.set(accountIdKey, balanceInPaise);
    }

    public async signupUser({ username, hashedPassword }: userRequest): Promise<signupUserResponse> {
        const savedHash = await this.redisStoreClient.get(`user:${username}`);
        if (savedHash) {
            return { alreadyExists: true }
        }

        await this.redisStoreClient.set(`user:${username}`, hashedPassword);
        return { alreadyExists: false }
    }

    public async getUserHashedPassword({ username }: getUserHashedPasswordRequest): Promise<string | null> {
        return await this.redisStoreClient.get(`user:${username}`);
    }

    public async pushSignupUserQueue(user: userRequest): Promise<void> {
        await this.redisQueueClient.rPush(SIGNUP_USER_QUEUE, JSON.stringify(user));
    }
}

const emptyTransaction: TransactionRequest = {
    transactionId: '',
    senderId: '',
    recipientId: '',
    amountInPaise: 0
}

const emptyExecutedTransaction: ExecutedTransaction = {
    transactionId: '',
    senderId: '',
    recipientId: '',
    amountInPaise: 0,
    newSenderBalanceInPaise: 0,
    newRecipientBalanceInPaise: 0,
    timestamp: 0
}

export default RedisService;
