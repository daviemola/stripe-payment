const bodyParser = require('body-parser')
const express = require('express')
const Stripe = require('./src/connect/stripe')
const session = require('express-session')
var MemoryStore = require('memorystore')(session)
const UserService = require('./src/user')
const mongoose = require('mongoose')

const app = express()
app.use('/webhook', bodyParser.raw({ type: 'application/json' }))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use(express.static('public'))

app.post('/webhook', async (req, res) => {
  let event

  try {
    event = Stripe.createWebhook(req.body, req.header('Stripe-Signature'))
  } catch (err) {
    console.log(err)
    return res.sendStatus(400)
  }

  const data = event.data.object
  console.log(event.type, data)
  console.log('123 working')

  res.sendStatus(200)
})

app.use(
  session({
    saveUninitialized: false,
    cookie: { maxAge: 86400000 },
    store: new MemoryStore({
      checkPeriod: 86400000,
    }),
    resave: false,
    secret: 'keyboard cat',
  }),
)

app.engine('html', require('ejs').renderFile)

app.post('/checkout', async (req, res) => {
  const { customerID, product } = req.body
  console.log(product, customerID)
  const price = productToPriceMap[product.toUpperCase()]
  const session = await Stripe.createCheckoutSession(customerID, price)

  res.send({ sessionId: session.id })
})

app.get('/', async function (req, res, next) {
  res.status(200).render('login.ejs')
})

app.get('/account', async function (req, res) {
  const { email } = req.session
  const customer = await UserService.getUserByEmail(email)

  if (!customer) {
    res.redirect('/')
  } else {
    res.render('account.ejs', { customer })
  }
})

app.get('/success', (req, res) => {
  res.send('Payment successful')
})

app.get('/failed', (req, res) => {
  res.send('Payment failed')
})

app.post('/login', async (req, res) => {
  const { email } = req.body
  console.log('email', email)

  let customer = await UserService.getUserByEmail(email)
  let customerInfo = {}

  if (!customer) {
    console.log(`email ${email} does not exist. Making one.`)
    try {
      customerInfo = await Stripe.addNewCustomer(email)

      customer = await UserService.addUser({
        email: customerInfo.email,
        billingID: customerInfo.id,
        hasTrial: false,
        plan: 'none',
        endDate: null,
      })

      console.log(
        `A new user signed up and addded to DB. The ID for ${email} is ${JSON.stringify(
          customerInfo,
        )}`,
      )

      console.log(`User also added to DB. Information from DB: ${customer}`)
    } catch (e) {
      console.log(e)
      res.status(200).json({ e })
      return
    }
  }
  req.session.email = email
  res.redirect('/account')
  //   res.send('Customer created: ' + JSON.stringify(customer))
})

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // useCreateIndex: true,
    // useFindAndModify: false,
  })
  console.log('MongoDB Connected...')
}

connectDB()

const port = 4242

app.listen(port, () => console.log(`Listening on port ${port}!`))
