const express=require('express');
const Users=require('../models/users.model');
const bcrypt=require('bcrypt');
const nodemailer=require('nodemailer');
const jwt = require('jsonwebtoken');
const router=express.Router();
const CLIENT_URL="http://localhost:3000"

//|---------------------------------------Sign up--------------------------------------------------|
router.post('/signup',async(req,res)=>{
    try{
        const payload=req.body;

        //Email id validation
        const existUser= await Users.findOne({email:payload.email})
        if(existUser){
            return res.send({
                statusCode:400,
                message:"You are already a register user",
            });
        }
        //confirm password checking
        const isSamePassword =checkPassword(
            payload.password,
            payload.confirmPassword,
        );
        if(!isSamePassword){
            return res.send({
                statusCode:400,
                message:"password doesn't match",
            });
        }
            else{
                delete payload.confirmPassword;
            }
        //Password hashing 
        const randomString=await bcrypt.genSalt(10);
        hashedPassword=await bcrypt.hash(payload.password,randomString);

        //token generate and encrypted
        const token = jwt.sign({email:payload.email},process.env.VERIFY_TOKEN_KEY,{expiresIn:"1hr"});
        const newUsers= new Users({
            firstName:payload.firstName,
            lastName:payload.lastName,
            email:payload.email,
            password:hashedPassword,
            validToken:token
        });

        //save in db
        newUsers.save((err,data)=>{      
            if(err){
                return res.send({
                    statusCode:400,
                    message:"user not added" 
                })
            } 
            else{     
        const URL=`${CLIENT_URL}/verify-email?tk=${token}`;

        //SendMail
        const transporter=nodemailer.createTransport({
            service:"gmail",
            auth:{
                user:process.env.ACC_EMAIL,
                pass:process.env.ACC_PASS,
            },
        });
        const mailOptions={ 
            from:process.env.ACC_EMAIL,
            to:payload.email,
            subject:"Verify | Email",
            html:`<h2>Shortify</h2><br/>
            <span>Hi ${data.firstName},</span><br/>
            <p>Thank you for subscribing. Please confirm your email by clicking on the button below :</p>
            <a href=${URL} target="_blank"><Button style="background-color:#00A2ED; width:9rem; color:white; padding:10px; outline:none; border-radius:12px; border:none; margin-top:5px;">Verify Email</Button></a><br/><br/>
            <div><br/><br/>
            <span><strong>
            Or copy and paste the URL into your browser :
            </strong>
            </span>
            <p>${URL}</p>
            </div>`
        }
        transporter.sendMail(mailOptions,(err,info)=>{
            if(err){
                res.send("Error: error while sending please try again!")
            }
            else{
                 res.send({
                    statusCode:200,
                    userId:data._id,
                    message:"registered successfully, please! check your email to verify your account."
                })
            } 
        })
    }
});
    }
    catch{
        res.send({
            statusCode:500,
            message:"Internal server error"
        });
    }
})
const checkPassword=(password,confirmPassword)=>{
    return password !==confirmPassword ? false : true;
};

//|---------------------------------------Verify Email--------------------------------------------------|
router.get('/verify-email',async(req,res)=>{
    try{
        let verifyToken=req.query.tk;
        // decrypt the token
        jwt.verify(verifyToken,process.env.VERIFY_TOKEN_KEY, async(err,decodedData)=>{
            if(err){
                return res.send({
                    statusCode:400,
                    message:"Invalid or Expired Token"
                });
            }    
            // checking verifyToken exists in db or not
        const existToken= await Users.findOne({validToken:verifyToken})
        if(!existToken){
            return res.send({
                statusCode:400,
                message:"Link has expired.",
            });
        }
        
        else{
            // if token exist update the respective values given below
          await Users.updateOne({email:decodedData.email},{$set:{status:"active",validToken:""}});
          res.send({
            statusCode:200,
            message:"Email has been verified successfully"
          })
        }
    })
    }
    catch{
        res.send({
            statusCode:500,
            message:"Internal server error"
        });
    }  
});

//|---------------------------------------Sign In--------------------------------------------------|
router.post('/login',async(req,res)=>{
    try{
        const payload=req.body;

        //check whether user exist with verified email status active or not
        const existUser=await Users.findOne({$and:[{email:payload.email,status:"active"}]});
        if(!existUser){
            return res.send({
                statusCode:400, 
                message:"User doesn't exists please! signup"
            })  
        }

    // check the db password with entered password matching or not
    const isSamePassword =await bcrypt.compare(payload.password,existUser.password);
    if(!isSamePassword){
        return res.send({
            statusCode:400,
            message:"Incorrect password",
        })
    }
    
    //Generate token and send as response and token is encrypted form of payload.
    const token =jwt.sign({_id:existUser._id},process.env.SECRET_KEY,{expiresIn:"1hr"});
    res.send({
        statusCode:200,
        message:"Login successfully",
        token:token
    })
    }
    catch{
        res.send({
            statusCode:500,
            message:"Internal server error"
        });
    }
});

//|---------------------------------------Forgot Password--------------------------------------------------|
router.post('/forgotpassword',async(req,res)=>{
    try{
        const payload=req.body;
        const existUser=await Users.findOne({email:payload.email});
        if(!existUser){
           return res.send({
                statusCode:400,
                message:"user doesn't exist please! signup"
            })
        }
        const token =jwt.sign({_id:existUser._id},process.env.RESET_PASSWORD_KEY,{expiresIn:"10m"});
        await Users.updateOne({email:payload.email},{$set:{resetToken:token}})

            const URL=`${CLIENT_URL}/resetpassword/${existUser._id}?tk=${token}`;
            //sendMail
            const transporter=nodemailer.createTransport({
                service:"gmail",
                auth:{
                    user:process.env.ACC_EMAIL,
                    pass:process.env.ACC_PASS
                },
            });
            const mailOptions={ 
                from:process.env.ACC_EMAIL,
                to:payload.email,
                subject:"Password | Reset Mail",
                html:` Hi ${existUser.firstName},<br/><br/>  
                <span>Forgot your password?</span><br/>
                <span>we received a request to reset the password for your account.</span><br/><br/>
                <span>To reset your password, click on the button below:<span/><br/>
                <a href=${URL} target='_blank'><Button style=" background-color:#00A2ED; width:11em; color:white; padding:10px; outline: none; border-radius:12px; border:none; margin-top:5px; " >Reset password</Button></a><br/><br/>
              <div><br/><br/>
                  <h6>
                    Or copy and paste the URL into your browser:         
                  </h6>
                  <p>${URL}</p>
              
              </div>`
            }
            transporter.sendMail(mailOptions,(err,info)=>{
                if(err){
                     res.send("Error: error while sending please try again!")
                }
                else{
                     res.send({
                        statusCode:200,
                        message:"Email has been sent successfully!"
                    })
                }
            })  
    }
    catch{
        res.send({
            statusCode:500,
            message:"Internal server error"
        })
    }
});

//|---------------------------------------Reset Password--------------------------------------------------|
router.post('/resetpassword/:tokenId',async(req,res)=>{
    
        const tokenId=req.params.tokenId;
        const payload=req.body;
        const verifyToken=req.query.tk;

        //verify token
        jwt.verify(verifyToken,process.env.RESET_PASSWORD_KEY,async(err,decodedData)=>{
            if(err){
                return res.send({
                    statusCode:400,
                    message:"Invalid Token or Expired"
                })
            }
            //to check reset token is exist or not
            const existUser=await Users.findOne({resetToken:verifyToken});
            if(!existUser){
                return res.send({
                    statusCode:400,
                    message:"Link is expired"
                })
            }
            // to check the newPassword and confirmPassword are same or not
            const isSamePassword=checkPass(payload.newPassword,payload.confirmPassword);
            if(!isSamePassword){
                return res.send({
                    statusCode:400,
                    message:"password doesn't match"
                });
            }
            else{
                delete payload.confirmPassword; //no need to save confirmPassword in db
            }

            // to check current password is same as old password
            const existPassword=await bcrypt.compare(payload.newPassword,existUser.password);
            if(existPassword){
                return res.send({
                    statusCode:400,
                    message:"New password cannot be same as old password"
                });
            } 
        try{
            // password hashing
            const randomString= await bcrypt.genSalt(10);
            const hashedPassword=await bcrypt.hash(payload.newPassword,randomString);

            // save in db and null the resetToken for no longer to access it again
            await Users.updateOne({_id:tokenId},{$set:{password:hashedPassword,resetToken:""}});
            return res.send({
                statusCode:200,
                message:"Password has been reset successfully!"
            });
      
        }
        catch{
            res.send({
                statusCode:500,
                message:"Internal server error"
            })
        }  
    })  

});
const checkPass=(newPassword,confirmPassword)=>{
    return newPassword !== confirmPassword ? false : true;
};

//|---------------------------------------Get All Users--------------------------------------------------|
router.get('/',async(req,res)=>{
    
         Users.find((err,data)=>{
            if(err){
               return res.status(400).send({message:"no users data found"})
            }
        try{    
            res.send(data)
    }
    catch{
        res.send({
            statusCode:500,
            message:"Internal server error"
        })
    }  
})
})

module.exports=router;