export interface TransactionRequest {
    transactionId: string;
    senderId: string;
    recipientId: string;
    amountInPaise: number;
}

export type TransactionStatus = 'FAILURE' | 'SUCCESS' | 'PENDING'
