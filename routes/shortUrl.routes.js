const express=require('express');
const router=express.Router();
const auth=require('../middleware/auth')
const Url=require('../models/shortUrl.models');
const ShortId =require('../helpers/shortUrlGen');
const BASE_URL=process.env.BASE_URL;
router.post('/addurl',auth.authenticateUser,async(req,res)=>{
    try{
        let payload=req.body;
        let urlCode=ShortId();
        let urlShort = new Url({
            orgUrl:payload.orgUrl,
            urlId:urlCode,
            shortUrl:`${BASE_URL}/${urlCode}`
        });
      
         urlShort.save((err,data)=>{
            if(err){
               return res.send(err)
            } 
            res.send({
                statusCode:200,
                message:"URL Created Successfully",
                data:data
            })
        })
    }
    catch{
        res.send({
            statusCode:500,
            message:"Internal server error"
        })
    }
})

router.get('/:urlId',async(req,res)=>{
    try{
        const existUrl=await Url.findOne({urlId:req.params.urlId});
        if(!existUrl){
           return res.send({
                statusCode:400,
                message:"url not found"
            })
        }
        await Url.findByIdAndUpdate({_id:existUrl._id},{$inc:{clicks:1}})
        res.redirect(existUrl.orgUrl);
    }
    catch{
        res.send({
            statusCode:500,
            message:"Internal server error"
        })
    }
});




router.delete('/delete/:id',auth.authenticateUser,async(req,res)=>{
    try{
        let id=req.params.id; 
         Url.findByIdAndDelete({_id:id},(err,data)=>{
            if(!err && data){
                return res.status(200).send({Deleted_id:id,message:"Url Deleted Successfully"})
            }
            res.status(400).send({message:"Invalid Url Id"})
        });
    }
    catch{
        res.send({
            statusCode:500,
            message:"Internal server error"
        })
    }
})

router.get('/',auth.authenticateUser,async(req,res)=>{
    try{
        Url.find((err,data)=>{
            if(!err){
            return res.send(data)
            }
            res.send({
                statusCode:400,
                message:"Url data's not found"
            })
          
        });
    }
    catch{
        res.send({
            statusCode:500,
            message:"Internal server error"
        })
    }
})
module.exports=router