import express from 'express'
import sendMoneyRoute from './routes/send-money'
import fetchBalanceRoute from './routes/fetch-balance'
import loadCashRoute from './routes/load-cash'

const PORT = 3000

const app = express()
app.use(express.json())

app.get('/', (req, res) => {
    return res.json({
        message: "healthy server"
    })
})

app.use('/api/v1', sendMoneyRoute);
app.use('/api/v1', fetchBalanceRoute);
app.use('/api/v1', loadCashRoute);

app.listen(PORT, () => console.log(`server listening on port ${PORT}`))