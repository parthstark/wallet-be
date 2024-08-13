import { TransactionStatus } from "./transaction";

export interface updateRedisStoreUserBalancesRequest {
    senderId: string,
    newSenderBalanceInPaise: number,
    recipientId: string,
    newRecipientBalanceInPaise: number,
}
export interface publishTransactionStatusRequest { transactionId: string, transactionStatus: TransactionStatus }
export interface pushTransactionPreDBWriterQueueRequest {
    transactionId: string,
    senderId: string,
    recipientId: string,
    amountInPaise: number,
    newSenderBalanceInPaise: number,
    newRecipientBalanceInPaise: number,
}
export interface userRequest { username: string, hashedPassword: string }
export interface signupUserResponse { alreadyExists: boolean }
export interface getUserHashedPasswordRequest { username: string }
export interface setBalanceRequest { userId: string, balanceInPaise: number }