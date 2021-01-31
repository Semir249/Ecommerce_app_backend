const express=require('express');
const router=express.Router();
const orderController=require('../../controllers/shop/order');
const verify=require('../../middlewares/verify');

router.post('/order',verify,orderController.postOrder);
router.get('/order',verify,orderController.getOrder);

router.get('/all-orders',verify,orderController.getAllorder);

router.get('/favourites',orderController.getFavourites);
module.exports=router;