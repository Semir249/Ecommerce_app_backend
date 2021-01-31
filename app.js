const express=require('express');
const mongoose=require('mongoose');
const bodyParser=require('body-parser');
const path=require('path');
const multer=require('multer');
require('dotenv').config()
const app=express();

const authRoutes=require('./routes/auth/authRoutes');
const shopRoutes=require('./routes/shop/product');
const cartRoutes=require('./routes/shop/cart');
const orderRoutes=require('./routes/shop/order');
const verify=require('./middlewares/verify');
const fileStorage=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,path.join(__dirname, "images"));
    },
    filename:(req,file,cb)=>{
        cb(null,Date.now()+'-' + file.originalname);   
    }
})

const fileFilter=(req,file,cb)=>{
    if(file.mimetype==='image/png'||file.mimetype==='image/jpg'||file.mimetype==='image/jpeg'){
        cb(null,true);
    }
    else{
        cb(null,false);
    }
}

app.use(bodyParser.json());

app.use('/images',express.static(path.join(__dirname,'images')));
app.use(multer({storage:fileStorage,fileFilter:fileFilter}).array('image',8));
app.use((req,res,next)=>{
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,PATCH,DELETE');
    res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
    next();
});
app.use((error,req,res,next)=>{
    console.log(error);
    const status=error.statusCode || 500;
    const message=error.message;
    const data=error.data;
    res.status(status).json({message:message,data:data})
});

app.use(authRoutes);
app.use(shopRoutes);
app.use(cartRoutes);
app.use(orderRoutes);

mongoose.connect(process.env.DB_URL,{useNewUrlParser: true,useUnifiedTopology: true}).then(
    result=>{
    console.log('connected');
    }).catch(err=>{
        console.log(err);
    })


app.listen(3000);