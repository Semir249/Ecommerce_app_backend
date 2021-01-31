const jwt=require('jsonwebtoken');

module.exports=(req,res,next)=>{
    const token=req.header('Authorization');
    if(!token){
        return res.status(401).json({message:'Please login to continue',status:'not verified'});
    }
    try{
        const verified=jwt.verify(token,'secretkey');
        req.user=verified;
        console.log(req.user);
        next();
    }
    catch(err){
        res.status(400).json({message:'Please login to continue',status:'expired'});
    }
}