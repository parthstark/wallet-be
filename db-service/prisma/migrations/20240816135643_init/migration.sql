-- CreateTable
CREATE TABLE "User" (
    "userId" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "balanceInPaise" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "amountInPaise" INTEGER NOT NULL,
    "userBalanceAfterTransaction" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "creditorId" TEXT NOT NULL,
    "debitorId" TEXT NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_userId_key" ON "User"("userId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_creditorId_fkey" FOREIGN KEY ("creditorId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_debitorId_fkey" FOREIGN KEY ("debitorId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
