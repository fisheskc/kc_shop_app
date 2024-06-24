import { ProductService, productService } from "./product/product.service";
import { CreateProductDto, UpdateProductDto, DeleteProductDto, AddImagesDto, DeleteImagesDto } from './dtos/product.dto';
import { BadRequestError, NotAuthorizedError } from "@shoppingappkec/common";

export class SellerService {
    constructor(public productService: ProductService) {}
    async addProduct(createProductDto: CreateProductDto) {
        return await this.productService.create(createProductDto)
    }
    // We first check if we have a product with a given Id
    // From this method to search for a specific product with a specific id
    async updateProduct(updateProductDto: UpdateProductDto) {
        const product = await this.productService.getOneById(updateProductDto.productId)
         // If we did not get the product, we are going to return a new error
         // we need to check if the user has the right to update this object
         if(!product) return new BadRequestError('product not found!')
         // we need to check if the user has the right to update this object
         // We will get an object Id from the user
         // These errors are created inside the common folder. each one is an instance of custom error
         if(product.user.toString() !== updateProductDto.userId) {
            return new NotAuthorizedError()
         }
         return await this.productService.updateProduct(updateProductDto)
    }

    async deleteProduct(deleteProductDto: DeleteProductDto) {
        // We search for a specific product with an Id, & if we do not have the product inside our db, 
        // we will send a bad request error, otherwise we will delete.
        const product = await this.productService.getOneById(deleteProductDto.productId)
        // We will check if we have a product
        if(!product) return new BadRequestError('product not found!')
        // We have to check if the user has the right to delete this product. He is the owner of this product.
        // product.user - we change the object id here to a string & that it does not equal to the given user id
        if(product.user.toString() !== deleteProductDto.userId) {
            return new NotAuthorizedError()
        }
        return await this.productService.deleteProduct(deleteProductDto)
    }
    async addProductImages(addImagesDto: AddImagesDto) {
        const product = await this.productService.getOneById(addImagesDto.productId)
        // We will check if we have a product
        // We have to check if the user has the right to add images to this product.
        if(!product) return new BadRequestError('product not found!')
        if(product.user.toString() !== addImagesDto.userId) {
           return new NotAuthorizedError()
        }
        return await this.productService.addImages(addImagesDto)
    }

    async deleteProductImages(deleteImagesDto: DeleteImagesDto) {
        const product = await this.productService.getOneById(deleteImagesDto.productId)
        // We will check if we have a product
        // We have to check if the user has the right to add images to this product.
        if(!product) return new BadRequestError('product not found!')
        if(product.user.toString() !== deleteImagesDto.userId) {
           return new NotAuthorizedError()
        }
        return await this.productService.deleteImages(deleteImagesDto)
    }
}


export const sellerService = new SellerService(productService)