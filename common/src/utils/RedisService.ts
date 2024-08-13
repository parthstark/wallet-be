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

        const multi = this.redisClient.multi();
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
        await this.pubsubClient.publish(pubsubChannel, pubsubMessage);
    }

    public subscribeToTransaction(transactionId: string, callback: (message: string) => void): void {
        const pubsubChannel = `transaction:${transactionId}`;
        this.pubsubClient.subscribe(pubsubChannel, callback);
    }

    public async pushTransactionPreDBWriterQueue(transactionDBData: ExecutedTransaction): Promise<void> {
        await this.redisClient.rPush(TRANSACTION_PRE_DB_WRITER_QUEUE, JSON.stringify(transactionDBData));
    }

    public async popTransactionPreDBWriterQueue(): Promise<ExecutedTransaction> {
        const { element } = await this.redisClient.blPop(TRANSACTION_PRE_DB_WRITER_QUEUE, 0) ?? {};
        if (!element) {
            return emptyExecutedTransaction
        }

        const executedTransaction: ExecutedTransaction = JSON.parse(element);
        return executedTransaction
    }

    public async getBalance(userId: string): Promise<number> {
        const accountIdKey = `balance:${userId}`;
        const accountIdBalanceString = await this.redisClient.get(accountIdKey);
        const accountIdBalanceInPaise = parseInt(accountIdBalanceString || '0', 10);
        return accountIdBalanceInPaise
    }

    public async setBalance({ userId, balanceInPaise }: setBalanceRequest): Promise<void> {
        const accountIdKey = `balance:${userId}`;
        await this.redisClient.set(accountIdKey, balanceInPaise);
    }

    public async signupUser({ username, hashedPassword }: userRequest): Promise<signupUserResponse> {
        const savedHash = await this.redisClient.get(`user:${username}`);
        if (savedHash) {
            return { alreadyExists: true }
        }

        await this.redisClient.set(`user:${username}`, hashedPassword);
        return { alreadyExists: false }
    }

    public async getUserHashedPassword({ username }: getUserHashedPasswordRequest): Promise<string | null> {
        return await this.redisClient.get(`user:${username}`);
    }

    public async pushSignupUserQueue(user: userRequest): Promise<void> {
        await this.redisClient.rPush(SIGNUP_USER_QUEUE, JSON.stringify(user));
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
