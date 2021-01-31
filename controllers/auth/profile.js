const User = require("../../models/User");
const jwt=require('jsonwebtoken');
const crypto=require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendGridTransport = require('nodemailer-sendgrid-transport');
const { EROFS } = require("constants");
const transporter=nodemailer.createTransport(sendGridTransport({
    auth:
    {
            api_key: process.env.API_KEY
    }
    }));
exports.getProfile=(req,res,next)=>{
    User.findOne({username:req.user.username}).then(user=>{
        if(!user){
            const error=new Error('User profile not found');
            error.statusCode=404;
            res.status(404).json({message:'User profile not found'});
            throw error;
        }
        res.status(200).json({profile:{
            email: user.email,
            username: user.username,
            birthday: user.birthday,
            location: user.location,
            zipcode: user.zipcode,
        }});
    })
    .catch(err=>{
        if(!err.statusCode){
            err.statusCode=500;
            next(err);
        }
    })
}

exports.editProfile=(req,res,next)=>{
    const email=req.body.email;
    const username=req.body.username;
    const birthday=req.body.birthday;
    const location=req.body.location;
    const zipcode=req.body.zipcode;
    User.findOne({username:req.user.username}).then(user=>{
        if(!user){
            const error=new Error('User not found');
            error.statusCode=404;
            res.status(404).json({message:'User not found'});
            throw error;
        }
        user.email=email;
        user.username=username;
        user.birthday=birthday;
        user.location=location;
        user.zipcode=zipcode;
        return user.save();
    })
    .then(user=>{
        const token = jwt.sign({
            username: user.username
        },
            'secretkey',
            { expiresIn: '4h' });
        res.status(201).header('Authorization', token).json({ token: token,message:'User Profile Updated successfully'});
    })
    .catch(err=>{
        if(!err.statusCode){
            err.statusCode=500;
            next(err);
        }
    })
}

exports.postResetPassword=(req,res,next)=>{
    crypto.randomBytes(32,(err,buffer)=>{
        if(err){
            res.status(500).json({message:'Opps Something went wrong please try again'});
           return;
        }
        const token=buffer.toString('hex');
        User.findOne({email:req.body.email}).then(user=>{
            if(!user){
                const error=new Error('User not found');
                error.statusCode=404;
                res.status(404).json({message:'User not found'});
            }
            user.resetToken=token;
            user.resetTokenDate=Date.now()+3600000;
            return user.save();
        }).then(result=>{
            transporter.sendMail({
                to: req.body.email,
                from: 'semir@eccomerce.com',
                subject: 'Reset password',
                html: `
                <p>you requested a password reset</p>
                <p>click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password</p>
                `
            })
            res.status(201).json({message:`An email has been sent to ${req.body.email} click the link on the mail to reset password`});
        }).catch(err=>{
            if(!err.statusCode){
                err.statusCode=500;
                next(err);
            }
        })

    })
}

exports.postNewPassword=(req,res,next)=>{
    const newPassword=req.body.password;
    const passwordToken=req.body.passwordToken;
    let resetUser;
    User.findOne({resetToken:passwordToken,resetTokenDate:{$gt:Date.now()}}).then(user=>{
        if(!user){
            const error=new Error('Reset token expired please try again')
            error.statusCode=404;
            res.status(404).json({message:'User not found or reset token expired'});
            throw error;
        }
        resetUser=user;
       return bcrypt.hash(newPassword,12);
    }).then(hashedPassword=>{
        resetUser.password=hashedPassword;
        resetUser.resetToken=undefined;
        resetUser.resetTokenDate=undefined;
        return resetUser.save();
    }).then(result=>{
        res.status(200).json({message:'Password reset complete'});
    }).catch(err=>{
        if(!err.statusCode){
            err.statusCode=500;
            next(err);
        }
    })
}

exports.changePassword=(req,res,next)=>{
    const newPassword=req.body.newPassword;
    const password=req.body.password;
    
    User.findOne({username:req.user.username}).then(async(user)=>{
        if(!user){
            const error=new Error('User not found');
            error.statusCode=404;
            res.status(404).json({message:'User not found'});
            throw error;
        }
        const result=await bcrypt.compare(password,user.password)
        return {result,user};
    })
    .then(async({result,user})=>{
        
        if(!result){
            const error=new Error('Current password is not correct');
            error.statusCode=404;
            res.status(404).json({message:'Current password is not correct'});
            throw error;
        }
        bcrypt.hash(newPassword,12).then(hashed=>{
            user.password=hashed;
            user.save();
        });
        
        res.status(201).json({message:'Password changed successfully'});
    })
    .catch(err=>{
        if(!err.statusCode){
            err.statusCode=500;
            next(err);
        }
    })
}