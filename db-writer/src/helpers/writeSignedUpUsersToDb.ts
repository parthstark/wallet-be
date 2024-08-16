import { PrismaClient } from '@prisma/client';
import RedisService from '@common/utils/RedisService';

const prisma = new PrismaClient();

async function writeSignedUpUsersToDb() {
    const redisService = await RedisService.getInstance();

    while (true) {
        try {
            const user = await redisService.popSignupUserQueue();

            const { username, hashedPassword } = user;
            if (!username) {
                continue
            }

            await prisma.user.create({
                data: {
                    userId: username,
                    hashedPassword,
                    balanceInPaise: 0
                },
            })

        } catch (err) {
            console.error('error processing user:', err);
        }
    }
}

export default writeSignedUpUsersToDb