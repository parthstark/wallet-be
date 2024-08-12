import express from 'express'
import signupRoute from './routes/signup'
import loginRoute from './routes/login'
import authorizeRoute from './routes/authorize'

const PORT = 3001

const app = express()
app.use(express.json())

app.get('/', (req, res) => {
    res.json({
        message: "healthy server"
    })
})

app.use('/api/v1', signupRoute);
app.use('/api/v1', loginRoute);
app.use('/api/v1', authorizeRoute);

app.listen(PORT, () => console.log(`server listening on port ${PORT}`))