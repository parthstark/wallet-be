import writeSignedUpUsersToDb from "helpers/writeSignedUpUsersToDb";
import writeTransactionsToDb from "helpers/writeTransactionsToDb";

writeTransactionsToDb().catch(console.error)
writeSignedUpUsersToDb().catch(console.error)