import { JWT_SECRET_KEY } from "constants/constants";

export function validateConfig() {
    if (!JWT_SECRET_KEY) {
        throw new Error('Missing JWT_SECRET_KEY environment variable');
    }
}