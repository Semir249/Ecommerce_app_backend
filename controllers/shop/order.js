const User=require('../../models/User');
const Order=require('../../models/Order');
const Product=require('../../models/Product');
exports.postOrder=(req,res,next)=>{
    User.findOne({username:req.user.username}).populate('cart.items.productId')
    .exec()
    .then(async user=>{

        if(!user){
            const error=new Error('User not found');
            error.statusCode=404;
            res.status(404).json({message:'User not found'});
            throw error;
        }

        const products = await Promise.all(
            user.cart.items.map(async(i)=>{
                let product= await Product.findById(i.productId._id);
                if(product.quantity===0){
                    const error=new Error('Sorry Item is out of stock');
                    error.statusCode=403;
                    res.status(403).json({ error:'Sorry Item is out of stock'});
                    throw error;  
                }
                if(product.quantity<i.quantity){
                    const error=new Error(`Sorry only ${product.quantity} items in store`);
                    error.statusCode=403;
                    res.status(403).json({ error: `Sorry only ${product.quantity} items in store`});
                    throw error;   
                }
                product.quantity-=i.quantity;
                product.save();
                
                return {
                    productId:i.productId._id,
                    name:i.productId.name,
                    price:i.productId.price,
                    quantity:i.quantity
                }
            })
        );
        // const total = await products.reduce( (accumulator, product) =>{
        //     return accumulator + (product.quantity*product.price);
        //   }, 0);
        return {products,user};
        
    })
    .then(async ({products,user})=>{
        
        if(products.length===0){
            const error=new Error('You have an empty cart');
            error.statusCode=404;
            res.status(404).json({message:'Your cart is empty'});
            throw error;
        }
        for(let i in products){
            let order=new Order({
                products:products[i],
                total:products[i].price*products[i].quantity,
                status:'Pending',
                userId:user._id
            })
            await order.save();
            await user.deleteItemOrdering();
        }
         res.status(201).json({message:'Order placed'});
    })  
    .catch(err=>{
        if(!err.statusCode){
            err.statusCode=500;
            next(err);
        }
    
    })
}

exports.getOrder=async (req,res,next)=>{
    const userId=(await User.findOne({username:req.user.username}))._id;
    Order.find({userId:userId}).then(order=>{
        if(!order){
            const error=new Error('no order found for user')
            error.statusCode=404;
            res.status(404).json({message:'No order found for user'});
            throw error;
        }
        return order;
        
    }).then(order=>{
        res.status(200).json({orders:order})
    })
    .catch(err=>{
        if(!err.statusCode){
            err.statusCode=404;
            next(err);
        }
    })
}

exports.getAllorder=(req,res,next)=>{
    User.findOne({username:req.user.username}).then(user=>{
        if(!user){
            const error=new Error('User not found');
            error.statusCode=404;
            res.status(404).json({message:'User not found'});
            throw error;
        }
        if(user.role!=='ROLE_ADMIN'){
            const error=new Error('Opps something went wrong');
            error.statusCode=403;
            res.status(403).json({message:'Opps something went wrong'});
            throw error;
        }
        Order.find().then(orders=>{
            if(!orders){
                const error=new Error('Orders not found');
                error.statusCode=400;
                res.status(400).json({message:'No orders placed'});
                throw error;
            }
            res.status(200).json({orders:orders});
        })
    })
    .catch(err=>{
        if(!err.statusCode){
            err.statusCode=500;
            next(err);
        }
    })
}

exports.getFavourites=async (req,res,next)=>{
    const aggregate = await Order.aggregate([
        {
            $group:{
                _id:'$products.productId',
                count:{$sum:1}
            },
            
        }
    ]).sort({count:'desc'}).limit(3).exec();
    // console.log(aggregate);
    if(aggregate.length>0){
        let favproducts=[];
        const productIds=aggregate.map(item=>item._id);
        Product.find({_id: { $in: productIds }}).then(async products=>{
            switch(products.length){
                case 1:
                favproducts.push(await Product.find().limit(2).exec());
                case 2:
                favproducts.push(await Product.findOne().exec());
                case 3:
                favproducts.push(products);
            }
            return favproducts.flat();
            
        })
        .then(response=>{
            // console.log(response);
            return response.map(item=>item.images[0]);
        })
        .then(images=>{
            res.status(200).json({images:images.flat()});
        })
        .catch(err=>{
            if(!err.statusCode){
                err.statusCode=500;
                next(err);
            }
        })
    }
    

    
    
}