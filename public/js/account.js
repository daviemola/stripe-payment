$(document).ready(function () {
  const PUBLISHABLE_KEY = process.env.PUBLISHABLE_KEY

  const stripe = Stripe(PUBLISHABLE_KEY)
  const checkoutButton = $('#checkout-button')

  checkoutButton.click(function () {
    const product = $('input[name="product"]:checked').val()
    console.log(product)
    console.log(customer.billingID)

    fetch('/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product,
        customerID: customer.billingID,
      }),
    })
      .then((result) => result.json())
      .then(({ sessionId }) => stripe.redirectToCheckout({ sessionId }))
  })
})
