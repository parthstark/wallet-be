import { createClient, RedisClientType } from 'redis';
import { TRANSACTION_PRE_PROCESSOR_QUEUE } from '../constants/constants';
import { TransactionRequest } from '../types/transaction';

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

    public subscribeToTransaction(transactionId: string, callback: (message: string) => void): void {
        const pubsubChannel = `transaction:${transactionId}`;
        this.pubsubClient.subscribe(pubsubChannel, callback);
    }

    public getBalance(accountId: string): Promise<number> {
        return new Promise(resolve => resolve(1236700))
    }
}

export default RedisService;
