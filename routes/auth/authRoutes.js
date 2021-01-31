const express=require('express');
const router=express.Router();
const signupController=require('../../controllers/auth/signup');
const loginController=require('../../controllers/auth/login');
const profileController=require('../../controllers/auth/profile');
const verify=require('../../middlewares/verify');
router.post('/signup',signupController.signup);
router.post('/login',loginController.login);


router.post('/reset',profileController.postResetPassword);
router.post('/new-password',profileController.postNewPassword);

router.post('/change-password',verify,profileController.changePassword);

router.get('/profile',verify,profileController.getProfile);
router.put('/profile',verify,profileController.editProfile);

router.get('/status',verify,loginController.getStatus);
module.exports=router;