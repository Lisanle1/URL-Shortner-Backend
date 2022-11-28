const express =require ('express');
const dotenv =require('dotenv');
const db=require('./dbConfig/connect');
const cors=require('cors')
const bodyparser=require('body-parser')
const userRoutes=require('./routes/users.routes');
const urlRoutes=require('./routes/shortUrl.routes');
const port=process.env.PORT || 3001
const app=express();
dotenv.config();

//connecting db
db();

// Body-parser middleware
app.use(bodyparser.urlencoded({extended:false}))
app.use(bodyparser.json());

//cors 
app.use(cors());

//|----------------------------------------------------------------------------------|
app.get('/',(req,res)=>{
    res.send("Hello welcome to url shortner Api....")
});
//|----------------------------------------------------------------------------------|
app.use('/api/users',userRoutes);
app.use('/api/shortify',urlRoutes)

app.listen(port,()=>{
    console.log(`Server is listening on the port: ${port}`);
});