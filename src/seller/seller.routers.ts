// We need to know what type of data we will get from the client?
import { Router, Response, Request, NextFunction } from "express";
import { BadRequestError, uploadDir, Uploader, UploaderMiddlewareOptions, requireAuth, CustomError } from '@shoppingappkec/common'
import { sellerService } from './seller.service'
// We initiate the Uploader class
const uploader = new Uploader(uploadDir)
// The middleware is used inside the router
// Middleware options with type middleware uploader middleware options
const middlewareOptions: UploaderMiddlewareOptions = {
    types: ['image/png', 'image/jpeg'],
    fieldName: 'image'
}

const multipleFilesMiddleware = uploader.uploadMultipleFiles(middlewareOptions)

const router = Router();

router.post('/product/new', requireAuth, multipleFilesMiddleware, async(req: Request, res: Response, next: NextFunction) => {
    const { title, price } = req.body;
    // If we do not accept the type of the file, we will still get the request files here when we use the uploader middleware.
    // And because of that, we cannot check if we have a problem with the files type or not.
    // We require the user to create each product with at least one image. For this we need to check if we have the correct type of files
    // We will return a new batch request error with a different message saying that images are required. 
    if(!req.files) return next(new BadRequestError('images are required'))

    // We check if have an uploader error. If so, we are going to send that error to the client
    if(req.uploaderError) return next(new BadRequestError(req.uploaderError.message))

    // create product
    // After we create the product, we need to send it to the user.
    // We are getting the current user from the middleware in it's router
    const product = await sellerService.addProduct({
        title,
        price,
        userId: req.currentUser!.userId, 
        files: req.files})
    res.status(201).send(product)
    // send to user - we will do this inside the seller service & with the help of some methods inside the product service
})

router.post('/product/:id/update', requireAuth, async(req: Request, res: Response, next: NextFunction) =>{
    // We will get the Id from the request.params
    const { id } = req.params;
    const { title, price } = req.body;

    const result = await sellerService.updateProduct({ title, price, userId: req.currentUser!.userId, productId: id })
    // We used the instanceof here to check if the result is an instance of a custom error
    if(result instanceof CustomError) return next(result)
    // If we do not have any issues, we are going to send back the product to the user with a status of 200 & send the result
    // The result will be the updated product
    res.status(200).send(result)
})
// A delete router, & we give it the path of the product, the id & then delete it
// We need the authentication for this router
router.delete("/product/:id/delete", requireAuth, async(req: Request, res: Response, next: NextFunction) =>{
   // Here we will extract the id from the request.params 
   const { id } = req.params;
   // We will check for the result from the sellerService.delete product
   // We need the user Id that exists inside the request.currentuser
   const result = await sellerService.deleteProduct({ productId: id, userId: req.currentUser!.userId})
   // We used the instanceof here to check if the result is an instance of a custom error
   if(result instanceof CustomError) return next(result)
   // Otherewise we will send back true
   res.status(200).send(true)
})

router.post("product/:id/add-images", requireAuth, multipleFilesMiddleware, async(req: Request, res: Response, next: NextFunction) => {
   // Here we will extract the id from the request.params 
   const { id } = req.params;
   if(!req.files) return next(new BadRequestError('images are required'))

   // We check if have an uploader error. If so, we are going to send that error to the client
   if(req.uploaderError) return next(new BadRequestError(req.uploaderError.message))
   // We need the user Id that exists inside the request.currentuser
   const result = await sellerService.addProductImages({ productId: id, userId: req.currentUser!.userId, files: req.files })
   // Otherewise we will send back the result
   res.status(200).send(result)
})

router.post("product/:id/delete-images", requireAuth, async(req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    // We are waiting for the images ids array & we will get that from the body. Extract images id from the body.request 
    const { imagesIds } = req.body
    const result = await sellerService.deleteProductImages({ productId: id, userId: req.currentUser!.userId, imagesIds})
    
    // We used the instanceof here to check if the result is an instance of a custom error
    if(result instanceof CustomError) return next(result)
    // Otherewise we will send back the result
    res.status(200).send(result)
})

export { router as sellerRouters }