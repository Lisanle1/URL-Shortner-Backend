const mongoose=require('mongoose');
const validator =require('validator')

//schema definition
const userSchema= new mongoose.Schema({
    firstName:{
        type:String,
        required:true,
        trim:true,
    },
    lastName:{
        type:String,
        required:true,
        trim:true,
    },
    email:{
        type:String,
        unique:true,
        required:true,
        trim:true,
        lowercase:true,
        validate:(value)=>{
            return validator.isEmail(value);
        }
    },
    password:{
        type:String,
        required:true,
    },
    confirmPassword:{
        type:String,
    },
    links:[],
    linksCount:{
        type:String,
        default:0
    },
    status:{
        type:String,
        enum:['pending','active'],
        default:'pending',
    },
    validToken:{
        type:String
      
    },
    resetToken:{
        type:String
    }

})

module.exports=mongoose.model('users',userSchema);