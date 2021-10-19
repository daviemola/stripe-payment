const stripe = require('stripe')
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

const Stripe = stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2020-08-27',
})

const addNewCustomer = async (email) => {
  const customer = await Stripe.customers.create({
    email,
    description: 'New Customer',
  })
  return customer
}

const getCustomerByID = async (id) => {
  const customer = await Stripe.customers.retrieve(id)
  return customer
}

const createCheckoutSession = async (customer, price) => {
  const session = await Stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer,
    line_items: [
      {
        price,
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: 14,
    },

    success_url: `http://localhost:4242/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `http://localhost:4242/failed`,
  })

  return session
}

const createWebhook = (rawBody, sig) => {
  console.log('create hook works')
  const event = Stripe.webhooks.constructEvent(
    rawBody,
    sig,
    STRIPE_WEBHOOK_SECRET,
  )
  return event
}

module.exports = {
  addNewCustomer,
  getCustomerByID,
  createCheckoutSession,
  createWebhook,
}
