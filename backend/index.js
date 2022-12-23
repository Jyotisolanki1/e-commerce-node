const express =require('express');
const cors = require('cors');
require('./db/config');
const  User = require('./db/users');
const Product = require('./db/products');
const app = express();
const jwt = require('jsonwebtoken');
const jwtKey = 'e-com';


app.use(express.json());
app.use(cors());


app.post('/register',async(req,res)=>{
    let user = new User(req.body);
    let result = await user.save();
    result=result.toObject();
    delete result.password;
    jwt.sign({ result }, jwtKey, { expiresIn: "5h" }, (err, token) => {
        if (err) {
            res.send({ result: "something is going wrong , Please try after some time" })
        }
        res.send({ result, auth: token });
    })
});
app.post('/login',async(req,res)=>{
  
    if(req.body.password && req.body.email){
        let user =await User.findOne(req.body).select("-password");
        if(user){
            jwt.sign({user},jwtKey,{expiresIn:"5h"},(err,token)=>{
                if(err){
                    res.send({result:"something is going wrong , Please try after some time"})
                }
                res.send({user,auth:token});
            })
       
        }else{
            res.send({"result":"no user found"})
        }
    }else{
        res.send({"result":"no user found"})
    }
});
app.post('/productAdd',async(req,res)=>{
   let pro = new Product(req.body)
   let result =await pro.save();
   res.send(result);
});
app.get('/productList',verifyToken,async(req,res)=>{
  let proList =await Product.find();
  if(proList.length>0){
    res.send(proList);
  }
  else{
    res.send({result:"No Product Found"})
  }
  
});

app.delete("/delete/:id",verifyToken,async(req,res)=>{
    
   let product = await Product.deleteOne(req.params);  
    
    if(product){
        res.send({result:"product deleted"});
    }else{
        res.send({result:"record not find"});
    }

});

app.get("/productUpdate/:id",verifyToken,async(req,res)=>{
    let result = await Product.findOne({_id:req.params.id});
    if(result){
    res.send(result);
    }
    else{
        res.send({resp:"No result found"});
    }
});
app.put('/product/:id',async(req,res)=>{
    let result = await Product.updateOne(
        {_id:req.params.id},
        {$set:req.body}
        )
        res.send(result);
});

app.get('/search/:key',verifyToken,async(req,res)=>{
    let search = await Product.find({
        "$or":[
            {name:{$regex:req.params.key}},
            {company:{$regex:req.params.key}},
            {category:{$regex:req.params.key}}
        ]
    });
    res.send(search);

});
function verifyToken(req,res,next){
    let token = req.headers['authorization'];
    if(token){
      token = token.split(" ")[1];
      jwt.verify(token,jwtKey,(err,valid)=>{
        if(err){
            res.status(401).send({result:"Please provide valid token"});
        }else{
            next();
        }
      })
    }else{
        res.status(403).send({result:"Please add token with header"});
    }
}


app.listen(5000);