import { Router, Response, Request, NextFunction } from 'express';
import { requireAuth, CustomError, BadRequestError } from '@shoppingappkec/common';
import { buyerService } from './buyer.service';


// We initiate the router
const router = Router()
router.post('/cart/add', requireAuth, async(req: Request, res: Response, next: NextFunction) => {
    // We need the productId, quantity from the request.body
    // To get this "req.currentUser!.userId", we need to use the require auth middleware here
    const { productId, quantity } = req.body;
    // We check if it is a new cart and it is an instance of the custom error
    const result = await buyerService.addProductToCart({ productId, quantity, userId: req.currentUser!.userId })
   
    if(result instanceof CustomError || result instanceof Error) return next(result)
    // If we do not have any errors, we will send a status of 200. 
    // We can check if the result is an instance of error
    // We spread the - ...req.session, inside the object, because we already have a JWT property inside the session
    // If we change the value of the session, then we lose the JWT token & we log out the user.
    // We will get the JWT & the cartId 
    req.session = { ...req.session, cartId: result._id}
    res.status(200).send(result)
})

router.post('/cart/:cartId/product/:id/update-quantity', async (req: Request, res: Response, next: NextFunction) => {
    // Here we will extract the amount & increment options from the request.body
    const { amount } = req.body;
    const { cartId, id: productId } = req.params;

    // We check if we have to decrease or increase the quantity & we do that by checking the value of the increment option
    // Check if increment is going to be true or false. If increment is not either true or false we will return null
    const inc = req.body.inc === "true" ? true : req.body.inc === " false" ? false : null
    if(inc === null) return next(new BadRequestError('inc should be either true or false'))
    // If we havre the correct value of increment, the you call the update counter product quantity 
    const result = await buyerService.updateCartProductQuantity({ cartId, productId, options: { amount, inc } })
    // Here we are not handling the null result & because of that we can send null to the client.
    if( result instanceof CustomError || result instanceof Error ) return next(result)

    res.status(200).send(result)
})

router.post('/cart/:delete/product', async (req: Request, res: Response, next: NextFunction) => {
    // The productId is for the real product inside the seller service site, not for the cart.product cartProduct
    const { cartId, productId } = req.body
    // We will remove the product using the removeProduct from cart method.
    const result = await buyerService.removeProductFromCart({ cartId, productId })
    if( result instanceof CustomError ||
        result instanceof Error ) return next(result)
    
    res.status(200).send(result)    
})

router.post('/get/cart/', async (req: Request, res: Response, next: NextFunction) => {
    const cartId = req.session?.cartId;
    if(!cartId) return next(new BadRequestError('cartId is required!'))
    const result = await buyerService.getCart(cartId, req.currentUser!.userId)

    if( result instanceof CustomError ||
        result instanceof Error ) return next(result)

    res.status(200).send(result)
})

router.post('/payment/checkout/', async (req: Request, res: Response, next: NextFunction) => {
    const { cartToken } = req.body
    // We need the userId from the request currentUser 
    const result = await buyerService.checkout(req.currentUser!.userId, cartToken, req.currentUser!.email) 

    // We still need the update card router, because inside the checkout method we are saving the card to the Strip DB
    // If the user tries to create another checkout & they have a customerId, we are going to proceed to the charge & then 
    // we will charge the saved card
    // The user might want to change the card
    if(result instanceof CustomError) return next(result)

    res.status(200).send(result.id)
})

router.post('/payment/card/update', async (req: Request, res: Response, next: NextFunction) => {
    const { cartToken } = req.body
    const result = await buyerService.updateCustomerStripeCard(req.currentUser!.userId, cartToken)
    
    if( result instanceof CustomError ||
        result instanceof Error ) return next(result)
        // if result is an instance of the error class, then we have updated the card & send it
        res.status(200).send(result)
})

export { router as buyerRouters }