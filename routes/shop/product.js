const express=require('express');
const router=express.Router();
const productController=require('../../controllers/shop/products');
const verify=require('../../middlewares/verify');


router.get('/product/:id',productController.getProduct);
router.post('/product',verify,productController.addProduct);
router.get('/product',productController.getProducts);
router.delete('/product/:id',verify,productController.deleteProduct);
router.put('/product/:id',verify,productController.editProduct);

router.get('/product-review/:id',productController.getProductReviews);
router.post('/product-review',verify,productController.productReview);
router.put('/product-review',verify,productController.editReview);

router.get('/my-review',verify,productController.getMyReviews);
router.delete('/my-review',verify,productController.deleteReview);
module.exports=router;