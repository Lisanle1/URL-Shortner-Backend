const mongoose =require ('mongoose');

const db=async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URL);
        console.log('db connection established.');
    }
    catch(error){
        console.log("DB Error: ",error );
    }
}
module.exports=db;