const mongoose=require('mongoose');
const Schema=mongoose.Schema;

const ProductSchema=new Schema({
    images:[{
        type:String
    }],
    name:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    description:{
        type:String
    },
    quantity:{
        type:Number,
        required:true
    },
    category:{
        type:String,
        required:true
    },
    ratings:Number,
    reviews:[
        {
        user:{
            type:Schema.Types.ObjectId,
            ref:'User'
        },
        comment:{
            type:String
        },
        stars:{
            type:Number,
            required:true
        }
    }]
});

module.exports=mongoose.model('Product',ProductSchema);