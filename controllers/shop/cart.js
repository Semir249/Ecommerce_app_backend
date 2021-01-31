const User=require('../../models/User');
const Product=require('../../models/Product');
exports.postCart=(req,res,next)=>{
    const prodId=req.body.id;
    const amount=req.body.quantity;
    Product.findById(prodId).then(result=>{
        if(!result){
            const error = new Error('Sorry item not found')
            error.statusCode = 401;
            res.status(401).json({ error: "Sorry item not found" });
            throw error;
        }
        return result;
    }).then(prod=>{
        User.findOne({username:req.user.username}).then(user=>{
            return user.addToCart(prod,amount);
        }).then(()=>{
            res.status(201).json({message:`${amount} ${prod.name} added to your cart`});
        })

    }).catch(err=>{
        if(!err.statusCode){
            err.statusCode=500;
            next(err);
        }
    })
}

exports.getCart=(req,res,next)=>{
    User.findOne({username:req.user.username}).then(user=>{
        if(!User){
            const error=new Error('user not found');
            error.statusCode=401;
            res.status(401).json({ error: "User not found" });
            throw error;
        }
        // res.status(200).json({cart:user.cart.items});
        return user.cart.toObject();
    })
    .then(async cart=>{
        const newCart=await Promise.all(
            cart.items.map(async item=>{
                const product=await Product.findById(item.productId).select('name price images quantity')
                item.name=product.name;
                item.price=product.price;
                item.images=product.images;
                item.left=product.quantity;
                return item;
            })
        );
        res.status(200).json({cart:newCart});
    })
    .catch(err=>{
        if(!err.statusCode){
            err.statusCode=500;
            next(err);
        }
    })
}

exports.editCart=(req,res,next)=>{
    const prodId=req.body.id;
    const quantity=req.body.quantity;

    User.findOne({username:req.user.username}).then((user)=>{
            if(!user){
                const error=new Error('user not found');
            error.statusCode=401;
            res.status(401).json({ error: "User not found" });
            throw error;
            }
            let cartIndex=user.cart.items.findIndex(item=>{
                return item.productId.toString()===prodId.toString();
            })

            if(cartIndex<0){
                const error=new Error('This item is not in your cart');
                error.statusCode=403;
                res.status(403).json({error:'This item is not in your cart'});
                throw error;
            }

            return user.editCartItem(quantity,cartIndex);
            
        }
    )
    .then((response)=>{
        res.status(200).json({message:'Cart edited successfully'});
    })
    .catch(err=>{
        if(!err.statusCode){
            err.statusCode=500;
            next(err);
        }
    })
}

exports.deleteCartItem=(req,res,next)=>{
    const cartId=req.params.id;
    
    User.findOne({username:req.user.username}).then((user)=>{
        if(!user){
            const error=new Error('user not found');
        error.statusCode=401;
        res.status(401).json({ error: "User not found" });
        throw error;
        }
        let cartIndex=user.cart.items.findIndex(item=>{
            return item._id.toString()===cartId.toString();
        })
        if(cartIndex<0){
            const error=new Error('This item is not in your cart');
            error.statusCode=403;
            res.status(403).json({error:'This item is not in your cart'});
        }

        return user.deleteCartItem(cartIndex);
    })
    .then(response=>{
        res.status(200).json({message:'Item removed from cart'});
    })
    .catch(err=>{
        if(!err.statusCode){
            err.statusCode=500;
            next(err);
        }
    })
}

exports.clearCart=(req,res,next)=>{
    User.findOne({username:req.user.username}).then((user)=>{
        if(!user){
            const error=new Error('user not found');
        error.statusCode=401;
        res.status(401).json({ error: "User not found" });
        throw error;
        }
        return user.clearCart();
    })
    .then(response=>{
        res.status(203).json({message:'Cart cleared'});
    })
    .catch(err=>{
        if(!err.statusCode){
            err.statusCode=500;
            next(err);
        }
    })
}