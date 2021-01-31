const mongoose=require('mongoose');
const Schema=mongoose.Schema;

const orderSchema=new Schema({
    products:{
        productId:{
            type:Schema.Types.ObjectId,
            required:true
        },
        image:{
            type:String,
            required:true
        },
        name:{
            type:String,
            required:true
        },
        quantity:{
            type:Number,
            required:true
        },
        price:{
            type:Number,
            required:true
        }
    },
    total:{
        type:Number,
        required:true
    },
    status:{
        type:String,
        required:true
    },
    userId:{
        type:Schema.Types.ObjectId,
        required:true,
        ref:'user'
    }

}
,
{timestamps:true});



module.exports=mongoose.model('order',orderSchema);

