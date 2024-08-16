import express from 'express'
import fetchBalanceRoute from './routes/fetch-balance'
import fetchTransactionsRoute from './routes/fetch-transactions'
import writeSignedUpUsersToDb from "helpers/writeSignedUpUsersToDb";
import writeTransactionsToDb from "helpers/writeTransactionsToDb";

// DB Writing Process - Transactions 
writeTransactionsToDb().catch(console.error)

// DB Writing Process - Users 
writeSignedUpUsersToDb().catch(console.error)

// Express Server Process
const PORT = 3002

const app = express()
app.use(express.json())

app.get('/', (req, res) => {
    return res.json({
        message: "healthy server"
    })
})

app.use('/api/v1', fetchBalanceRoute);
app.use('/api/v1', fetchTransactionsRoute);

app.listen(PORT, () => console.log(`server listening on port ${PORT}`))