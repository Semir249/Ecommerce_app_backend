const mongoose=require('mongoose');
const Schema=mongoose.Schema;

const userSchema=new Schema({
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    username:{
        type:String,
        required:true
    },
    birthday:{
        type:String,
        required:true
    },
    location:{
        type:String,
        required:true
    },
    zipcode:{
        type:String,
        required:true
    } ,
    role:{
        type:String
    },
    resetToken:String,
    resetTokenDate:Date,
    cart:{
        items:[
            {
            productId:{
                type:Schema.Types.ObjectId,
                ref:'Product',
                required:true
            },
            quantity:{
                type:Number,
                required:true
            }
        }]
    }
});
userSchema.methods.addToCart=function(product,amount){
    const cartIndex = this.cart.items.findIndex(cp => {
        return cp.productId.toString() === product._id.toString();
        });
    const updatedCartItems=[...this.cart.items];

    if(cartIndex>=0){
        updatedCartItems[cartIndex].quantity+=amount;
    }
    else{
        updatedCartItems.push({productId:product.id,quantity:amount});
    }
    this.cart={items:updatedCartItems};
    return this.save();
}

userSchema.methods.editCartItem=function(amount,cartIndex){
    this.cart.items[cartIndex].quantity=amount;
    return this.save();
}

userSchema.methods.deleteCartItem=function(cartIndex){
    const updatedCartItems=[...this.cart.items];
    updatedCartItems.splice(cartIndex,1);
    this.cart.items=updatedCartItems;
    return this.save();
}

userSchema.methods.deleteItemOrdering=function(){
    this.cart.items.shift();
    return this.save();
}

userSchema.methods.clearCart=function(){
    this.cart.items.splice(0,this.cart.items.length);
    return this.save();

}

module.exports=mongoose.model('User',userSchema)