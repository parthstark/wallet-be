import { createClient, RedisClientType } from 'redis';
import { TransactionRequest, TransactionStatus } from '../types/transaction';
import { TRANSACTION_PRE_PROCESSOR_QUE } from '../constants/constants';

interface fetchBalanceRequest { senderId: string, recipientId: string }
interface fetchBalanceResponse { senderBalance: number, recipientBalance: number }
interface updateBalanceRequest {
    senderId: string,
    newSenderBalance: number,
    recipientId: string,
    newRecipientBalance: number,
}
interface publishTransactionStatusRequest { transactionId: string, transactionStatus: TransactionStatus }

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

    public async popTransaction(): Promise<TransactionRequest> {
        const { element } = await this.redisClient.blPop(TRANSACTION_PRE_PROCESSOR_QUE, 0) ?? {};

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

        const senderBalance = parseInt(senderBalanceString || '0', 10);
        const recipientBalance = parseInt(recipientBalanceString || '0', 10);

        return { senderBalance, recipientBalance }
    }

    public async updateBalance({
        senderId,
        newSenderBalance,
        recipientId,
        newRecipientBalance
    }: updateBalanceRequest): Promise<void> {
        const senderBalanceKey = `balance:${senderId}`;
        const recipientBalanceKey = `balance:${recipientId}`;

        const multi = this.redisClient.multi();
        multi.set(senderBalanceKey, newSenderBalance);
        multi.set(recipientBalanceKey, newRecipientBalance);
        await multi.exec();
    }

    public async publishTransactionStatus({ transactionId, transactionStatus }: publishTransactionStatusRequest): Promise<void> {
        const pubsubChannel = `transaction:${transactionId}`;
        const pubsubMessage = JSON.stringify({
            transactionStatus,
            timestamp: new Date().getTime(),
        })
        console.log(pubsubChannel, pubsubMessage);
        await this.pubsubClient.publish(pubsubChannel, pubsubMessage);
    }
}

export default RedisService;
