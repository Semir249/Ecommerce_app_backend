const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt=require('jsonwebtoken');

exports.login=(req,res,next)=>{
    const username=req.body.username;
    const email=req.body.email;
    const password=req.body.password;

    if(email){
        let loadedUser;
    User.findOne({ email: email }).then(user => {
        if (!user) {
            const error = new Error('Validation failed');
            error.statusCode = 422;
            res.status(401).json({ message: "wrong email or password" })
            throw error;
        }
        loadedUser = user;
        return bcrypt.compare(password, user.password);
    }).then(isEqual => {
        if (!isEqual) {
            const error = new Error("wrong password")
            error.statusCode = 401;
            res.status(401).json({ message: "wrong email or password" })
            throw error;

        }

        const token = jwt.sign({
            username: loadedUser.username
        },
            'secretkey',
            { expiresIn: '4h' });
        res.status(201).header('Authorization', token).json({ token: token,role:loadedUser.role});
    })
        .catch(err => {
            if(!err.statusCode){
                err.statusCode=500;
                next(err);
            }
        })
    }

    if(username){
        let loadedUser;
    User.findOne({ username: username }).then(user => {
        if (!user) {
            const error = new Error('Validation failed');
            error.statusCode = 422;
            res.status(401).json({ message: "wrong username or password" })
            throw error;
        }
        loadedUser = user;
        return bcrypt.compare(password, user.password);
    }).then(isEqual => {
        if (!isEqual) {
            const error = new Error("wrong email or password")
            error.statusCode = 401;
            res.status(401).json({ message: "wrong username or password" })
            throw error;

        }

        const token = jwt.sign({
            username: loadedUser.username
        },
            'secretkey',
            { expiresIn: '4h'});
        res.status(201).header('Authorization', token).json({ token: token,role:loadedUser.role});
    })
        .catch(err => {
            if(!err.statusCode){
                err.statusCode=500;
                next(err);
            }
        })
    }
}

exports.getStatus=(req,res,next)=>{
    User.findOne({username:req.user.username}).then(user=>{
        if(!user){
            const error = new Error("User not found")
            error.statusCode = 401;
            res.status(401).json({ message: "User not found" })
            throw error;
        }
    res.status(200).json({message:"verified",role:user.role});
    }).catch(err=>{
        if(!err.statusCode){
            err.statusCode=500;
            next(err);
        }
    })
}