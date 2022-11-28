const mongoose=require('mongoose');

//schema defining
const urlSchema= new mongoose.Schema({
    urlId:{
        type:String,
        required:true,
    },
    orgUrl:{
        type:String,
        required:true,
    },
    shortUrl:{
        type:String,
        unique:true,
        default:"",
    },
    clicks:{
        type:Number,
        default:0
    },
    created_At:{
        type:Date,
        default:Date.now
    },
    updated_At:{
        type:Date,
        default:Date.now
    }
});

module.exports = mongoose.model("urls",urlSchema);