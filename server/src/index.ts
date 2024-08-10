import express from 'express'
import sendMoneyRoute from './routes/send-money'
import fetchBalanceRoute from './routes/fetch-balance'

const PORT = 3000

const app = express()
app.use(express.json())

app.get('/', (req, res) => {
    res.json({
        message: "healthy server"
    })
})

app.use('/api/v1', sendMoneyRoute);
app.use('/api/v1', fetchBalanceRoute);

app.listen(PORT, () => console.log(`server listening on port ${PORT}`))