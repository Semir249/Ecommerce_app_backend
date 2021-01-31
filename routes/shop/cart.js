const express=require('express');
const router=express.Router();
const cartController=require('../../controllers/shop/cart');
const verify=require('../../middlewares/verify');

router.get('/cart',verify,cartController.getCart);
router.post('/cart',verify,cartController.postCart);
router.patch('/cart',verify,cartController.editCart);
router.delete('/cart/:id',verify,cartController.deleteCartItem);
router.delete('/cart',verify,cartController.clearCart);
module.exports=router;