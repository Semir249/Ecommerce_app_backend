const Product = require('../../models/Product');
const User = require('../../models/User');
const Order = require('../../models/Order');
const mv = require('mv');
const fs = require('fs');
const path=require('path');
const { ObjectID } = require('bson');
const { findOne } = require('../../models/User');
const { response } = require('express');
function deleteImageFiles(id=''){
    fs.readdir('images/'+id, (err, files) => {
        if (err) throw err;
      
        for (const file of files) {
            if(path.extname(file).toLowerCase() === '.jpg' || path.extname(file).toLowerCase() === '.png'
            ||path.extname(file).toLowerCase() === '.jpeg')
          {
            fs.unlink(path.join('images',id, file), err => {
            if (err) throw err;
          });
        }
        }
      });
}

exports.addProduct = async (req, res, next) => {
    const photos = req.files;
    const name = req.body.name
    const quantity = req.body.quantity;
    const category = req.body.category;
    const price = req.body.price;
    const description =req.body.description;
    const id=new ObjectID()
    const images = await photos.map(element => {
        return `images/${id}/${element.filename}`;
    });
    const product= new Product({
        _id:id,
        name:name,
        category:category,
        price:price,
        quantity:quantity,
        images:images,
        description:description
    });

    User.findOne({username:req.user.username}).then(
        (user)=>{
            if(!user){
                res.status(405).json({message:`User not found with username : ${req.user.username}`})
            }
            if(user.role === 'ROLE_ADMIN'){
                product.save().then(response=>{
                    return response;
                    })
                    .then(product=>{
                        if (!fs.existsSync(`./${product.id}`)) {
                            fs.mkdirSync(`./images/${product.id}`);
                       }
                
                       for (i in photos) {
                           let currentDestination = photos[i].path;
                           let newDestination = `${photos[i].destination}/${product.id}/${photos[i].filename}`
                            mv(currentDestination, newDestination, function (err) {
                               if (err) {
                                   throw err
                               } else {
                                   console.log("Successfully moved the file!");
                   
                               }
                           });
                       }
                       deleteImageFiles();
                       res.status(201).json({message:'Products added successfully'});
                    }
                    )
                    .catch(err=>{
                        deleteImageFiles();
                        res.status(400).json({message:"Something went wrong while adding product"});
                        
                    })
                .catch(err=>{
                    res.status(500).json({message:'Unable to add product'})
                })
            }
            else{
                deleteImageFiles();
                res.status(401).json({message:"You don't have enough credentials to perform operation"});
            }
        }
    ).catch(err=>{
        res.status(500).json({message:'Opps something went wrong please try again'});
    })

    

}

exports.getProduct=(req,res,next)=>{
    Product.findOne({_id:req.params.id}).then(product=>{
        if(!product){
            const error=new Error('Product not found');
            error.statusCode=404;
            res.status(404).json({message:'Product not found'});
            throw error;
        }
        return product
        // res.status(200).json({product:product});
    })
    .then(async product=>{
        const editedReview=await Promise.all(product.reviews.map(async review=>{
            const user=await User.findById(review.user);
            return {
                _id:review._id,
                user:user.username,
                ...(review.comment)?{comment:review.comment}:{},
                stars:review.stars
            }
        }));
        return {
            _id:product._id,
            images:product.images,
            name:product.name,
            category:product.category,
            price:product.price,
            quantity:product.quantity,
            reviews:editedReview,
            ratings:product.ratings
        }
        
    })
    .then(response=>{
        res.status(200).json({product:response});
    })
    .catch(err=>{
        if(!err.statusCode){
            err.statusCode=500;
            next(err);
        }
    })
}

exports.getProducts=(req,res,next)=>{
    Product.find().then(result=>{
        res.status(200).json({products:result});
    })
    .catch(err=>{
        res.status(500).json({message:'Unable to retrieve products'});
    })

}

exports.deleteProduct=(req,res,next)=>{
    const id=req.params.id;
    User.findOne({username:req.user.username}).then(
        (user)=>{
            if(!user){
                res.status(405).json({message:`User not found with username : ${req.user.username}`})
            }
            if(user.role === 'ROLE_ADMIN'){
                Product.findByIdAndDelete(id).then(response=>{
                    if (!response) {
                        const error = new Error("Product not found")
                        error.statusCode = 401;
                        res.status(401).json({ error: "Product not found" })
                        throw error;
            
                    }
                    deleteImageFiles(id);
                    res.status(200).json({message:'Product deletd successfull'});
                }).catch(err=>{
                    if(!err.statusCode){
                        err.statusCode=500;
                        next(err);
                    }
                })
            }
            else{
                res.status(401).json({message:"You don't have enough credentials to perform operation"});
            }
        }
    ).catch(err=>{
        res.status(500).json({message:'Opps something went wrong please try again'});
    })
}

exports.editProduct=async (req,res,next)=>{
    const id=req.params.id;
    const photos = req.files;
    const name = req.body.name
    const quantity = req.body.quantity;
    const category = req.body.category;
    const price = req.body.price;
    const images = await photos.map(element => {
        return `images/${id}/${element.filename}`;
    });
    User.findOne({username:req.user.username}).then(
        (user)=>{
            if(!user){
                res.status(405).json({message:`User not found with username : ${req.user.username}`})
            }
            
            if(user.role === 'ROLE_ADMIN'){
                deleteImageFiles(id);
                Product.findById(id).then(product=>{
                    product.images=images;
                    product.name=name;
                    product.quantity=quantity;
                    product.category=category;
                    product.price=price;
                    return product.save();
                })
                .then(product=>{
                    for (i in photos) {
                        let currentDestination = photos[i].path;
                        let newDestination = `${photos[i].destination}/${product.id}/${photos[i].filename}`
                         mv(currentDestination, newDestination, function (err) {
                            if (err) {
                                throw err
                            } else {
                                console.log("Successfully moved the file!");
                
                            }
                        });
                    }
                    res.status(203).json({response:product,message:'Product updated successfully'});
                })
                .catch(err=>{
                    res.status(500).json({message:'Opps something went wrong please try again'}); 
                })
            }
            else{
                deleteImageFiles();
                res.status(401).json({message:"You don't have enough credentials to perform operation"});
            }
        }
    ).catch(err=>{
        res.status(500).json({message:'Opps something went wrong please try again'});
    })
}

exports.productReview=async (req,res,next)=>{
    const prodId=req.body.id;
    const comment=req.body.comment||null;
    const stars=req.body.stars;
    const userId=await (await User.findOne({username:req.user.username}))._id;
    Order.find({userId:userId}).then(async (order)=>{
        if(!order){
            const error=new Error('You have to order the product to review');
            error.statusCode=402;
            res.status(402).json({message:'You have to order the product to review'});
            throw error;
        }
        const productsOrdered=await order.map(order=>order.products);
        
        const productToReviewIndex=await productsOrdered.findIndex(prod=>{
            return prod.productId.toString()===prodId.toString();
        })
        if(productToReviewIndex<0){
            const error=new Error('You have to order the product to review');
            error.statusCode=402;
            res.status(402).json({message:'You have to order the product to review'});
            throw error;
        }
        return response;    
    }
    )
    .then(response=>{
        Product.findById(prodId).then(async(product)=>{
            if(!product){
                const error=new Error('Product not found');
                error.statusCode=404;
                res.status(404).json({message:'Product not found'});
                throw error;
            }
    
            if(stars>5 || stars <1){
                const error=new Error('Ratings should be between 1 and 5');
                error.statusCode=402;
                res.status(402).json({message:'Ratings should be between 1 and 5'})
                throw error;
            }
            const review={
                user:userId,
                ...(comment)?{comment:comment}:{},
                stars:stars
            }
            const userIndex=await product.reviews.findIndex(review=>{
                return review.user.toString()===userId.toString();
            })
            if(userIndex>=0){
                const error=new Error('You have already reviewed this product before');
                error.statusCode=401;
                res.status(401).json({message:'You have already review this product before'});
                throw error;
            }
            
            return {review,product};
        })
        .then(({review,product})=>{
            product.reviews.push(review);
            product.ratings=(product.ratings)?product.ratings:0;
            product.ratings= (product.ratings+review.stars)/product.reviews.length;
            product.save();
            res.status(201).json({message:'Thank you for reviewing the product'});
        })
        .catch(err=>{
            if(!err.statusCode){
                err.statusCode=404;
                next(err);
            }
        })
    })
    .catch(err=>{
        if(!err.statusCode){
            err.statusCode=500;
            next(err);
        }
    })

}

exports.editReview=async (req,res,next)=>{
    const reviewId=req.body.reviewId;
    const prodId=req.body.id;
    const comment=req.body.comment||null;
    const stars=req.body.stars;
    const userId=await (await User.findOne({username:req.user.username}))._id;
    await Product.findById(prodId).then(product=>{
        if(!product){
            const error=new Error('Product not found');
                error.statusCode=404;
                res.status(404).json({message:'Product not found'});
                throw error;
        }
        return product;
    })
    .then(async(product)=>{
        var reviewIndex=await product.reviews.findIndex(review=>{
            return review._id.toString()===reviewId.toString();
        })
        if(reviewIndex<0){
            const error=new Error("You haven't reviewed this product before");
            error.statusCode=403;
            res.status(403).json({message:"You haven't reviewd this product before"});
            throw error;
        }
        else{
            if(product.reviews[reviewIndex].user.toString()===userId.toString()){
            if(comment){
            product.reviews[reviewIndex].comment=comment;
            }
            else{
                product.reviews[reviewIndex].comment=undefined; 
            }
            product.ratings=((product.ratings*product.reviews.length)-product.reviews[reviewIndex].stars+stars)/product.reviews.length;
            product.reviews[reviewIndex].stars=stars;
            product.save();
            res.status(202).json({message:'Your review is edited successfuly'});
        }
        else{
            res.status(404).json({message:"You don't have the permission to do that"});
        }
        }
        
    })
    .catch(err=>{
        if(!err.statusCode){
            err.statusCode=500;
            next(err);
        }
    })
}

exports.getProductReviews=(req,res,next)=>{
    const productId=req.params.id;
    Product.findById(productId).then(product=>{
        if(!product){
            const error=new Error('Product not found');
            error.statusCode=400;
            res.status(404).json({message:'Product not found'});
            throw error;
        }
        else{
            res.status(200).json({reviews:product.reviews.length>0?product.reviews:'No reviews for product'});
        }
    })
    .catch(err=>{
        if(!err.statusCode){
            err.statusCode=500;
            next(err);
        }
    })
}


exports.getMyReviews=async (req,res,next)=>{
    const userId=await (await User.findOne({username:req.user.username}))._id;

    Product.find().then(async(products)=>{
        if(!products){
            const error=new Error('No product found');
            error.statusCode=404;
            res.status(404).json({message:'No product found'});
        }
        const reviews=await products.map(product=>product.reviews).flat();
        return reviews;
    })
    .then(async(reviews)=>{
        const myReviews=await reviews.filter(review=>{return review.user.toString()===userId.toString()});
        res.status(200).json({reviews:myReviews.length>0?myReviews:"You haven't made any reviews"});
    })
    .catch(err=>{
        if(!err.statusCode){
            err.statusCode=500;
            next(err);
        }
    })
}

exports.deleteReview=async(req,res,next)=>{
    const reviewId=req.query.reviewId;
    const prodId=req.query.id;
    const userId=await (await User.findOne({username:req.user.username}))._id;

    await Product.findById(prodId).then(product=>{
        if(!product){
            const error=new Error('Product not found');
            error.statusCode=404;
            res.status(404).json({message:'Product not found'});
            throw error;
        }
        return product;
    })
    .then(async (product)=>{
        const productIndex=await product.reviews.findIndex(review=>{
            return review.user.toString()===userId.toString() && review._id.toString()===reviewId.toString();
        })

        if(productIndex<0){
            const error=new Error('Review not found');
            error.statusCode=404;
            res.status(404).json({message:'Review not found'});
            throw error;
        }
        else{
            if(product.reviews.length==1){
                product.ratings=undefined;
            }
            product.ratings=((product.ratings*product.reviews.length)-product.reviews[productIndex].stars)/(product.reviews.length-1);
            product.reviews.splice(productIndex,1);
            product.save();
            res.status(203).json({message:`You review for ${product.name} has been deleted`});
        }
    })
    .catch(err=>{
        if(!err.statusCode){
            err.statusCode=500;
            next(err);
        }
    })

}