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



const uri = `mongodb+srv://exellar-is-live:xJpDvDk8tqSZyrwS@cluster0.ouf3qgd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const usersCollection = client.db("Exellar").collection("users");
    const paymentCollection = client.db("Exellar").collection("paymentes");




   

// jwt token
app.post('/jwt',async(req,res)=>{
  const user = req.body;
  const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1s'})
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

  // insert email do does
  const query = { email: user.email };

  const existingUser = await usersCollection.findOne(query);
  if (existingUser) {
    return res.send({ message: "user already exists", insertId: null });
  }
  const result = await usersCollection.insertOne(user);
  res.send(result);
})


  // user data get
  app.get("/users", async (req, res) => {
   
    const result = await usersCollection.find().toArray();
    res.send(result);
  });

  app.get('/users/:email', async (req, res) => {
    const email = req.params.email; 
   
    
    try {
      // Query the users collection for the user with the specified email
      const user = await usersCollection.findOne({ email });
  
      if (!user) {
        return res.status(404).send({ success: false, message: 'User not found for the provided email.' });
      }
  
      res.status(200).send({ success: true, user });
    } catch (error) {
      console.error('Error retrieving user:', error);
      res.status(500).send({ success: false, message: 'Failed to retrieve user.', error });
    }
  });
  
  


  app.get('/users/admin/:email',  async (req, res) => {
    const email = req.params.email;
    try {
      const query = { email };
      const user = await usersCollection.findOne(query);
 
      const roles = {
        admin: false,
        moderator: false,
        guest: false,
      };
  
      if (user?.role) {
        const role = user.role.toLowerCase(); // Case-insensitive match
        roles.admin = role === 'admin';
        roles.moderator = role === 'moderator';
        roles.guest = role === 'guest';
      }
     
      
      res.send(roles);
    } catch (error) {
      console.error('Error fetching user role:', error);
      res.status(500).send({ message: 'Internal server error' });
    }
  });
  



  
  app.patch('/users/:email', async (req, res) => {
    const email = req.params.email; // Get the email from the request parameters
    const { role, status } = req.body; // Destructure role and status from the request body
  
    const filter = { email: email }; // Use email to filter the user
    const updateDoc = {
      $set: {
        role: role,
        status: status // Update the status if needed
      }
    };
  
    try {
      const result = await usersCollection.updateOne(filter, updateDoc);
      if (result.modifiedCount === 0) {
        return res.status(404).send({ message: 'User  not found or no changes made.' });
      }
      res.send(result);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).send({ message: 'Internal server error' });
    }
  });


  app.patch('/users/admin/:id',async(req,res)=>{
    const id = req.params.id;
    const roll = req.body;
    const { role } = req.body;
    const filter= {_id : new ObjectId(id)}
    const updateDoc ={
      $set:{
        role :role
      }
    }
    const result = await usersCollection.updateOne(filter,updateDoc)
   res.send(result)
  })
  




  app.post('/payment', async (req, res) => {
    try {
      const payment = req.body;
      console.log(payment);
      await paymentCollection.insertOne(payment);
      res.status(200).json({ message: 'Payment data received successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to save payment data' });
    }
  });
  
  // user data get
  app.get("/payment", async (req, res) => {
   
    const result = await paymentCollection.find().toArray();
    res.send(result);
  });

  app.patch('/payment/:id', async(req,res)=>{
    const id = req.params.id;
    const {status} =req.body;


    const filter= {_id : new ObjectId(id)}
    const updateDoc ={
      $set:{
        status :status
      }
    }
    const result = await paymentCollection.updateOne(filter,updateDoc)
    res.send(result)
   
   
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
