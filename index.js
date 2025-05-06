const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const {
  MongoClient,
  ServerApiVersion,
  ObjectId,
  serialize,
} = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;
app.use(express.json());
const cookieParser = require("cookie-parser");
const e = require("express");
app.use(cookieParser());



app.use(cors());
require("dotenv").config();



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@admission.f730r.mongodb.net/?retryWrites=true&w=majority&appName=admission`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const usersCollection = client.db("admission").collection("users");



// jwt token
app.post('/jwt',async(req,res)=>{
  const user = req.body;
  const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'5h'})
 res.send({token});

})

// verify admin  Token
const verifyAdmin = async(req,res,next)=>{
  const email  = req.decoded.email;
  const query = {email : email}
  const user = await usersCollection.findOne(query);
  const isAdmin = user?.role === 'Admin'
  if(!isAdmin){
    return  res.status(401).send({message:'forbidden access'})
  }
  next()

}
const verifyModerator = async(req,res,next)=>{
  const email  = req.decoded.email;
  const query = {email : email}
  const user = await usersCollection.findOne(query);
  const isAdmin = user?.role === 'Moderator'
  if(!isAdmin){
    return  res.status(401).send({message:'forbidden access'})
  }
  next()

}

//  middlewares
const verifyToken = (req,res,next)=>{

  if(!req.headers.authorization){
    return  res.status(401).send({message:'forbidden access'})

  }
const token = req.headers.authorization.split(' ')[1]
jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
  if(err){
    return  res.status(401).send({message:'forbidden access'})
  }
  req.decoded = decoded;
  next()
})

 
}




    app.post('/users',async(req,res)=>{
      const user = req.body;
console.log(user)
      // insert email do does
      const query = { email: user.email };

      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists", insertId: null });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    })







 
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running ");
});

app.listen(port, () => {
  console.log(`Exellar Is Live is  ${port}`);
});
