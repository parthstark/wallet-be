export interface TransactionRequest {
    transactionId: string;
    senderId: string;
    recipientId: string;
    amountInPaise: number;
}