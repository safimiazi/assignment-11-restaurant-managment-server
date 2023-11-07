const express = require('express')
const app = express()
var jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser')

var cors = require('cors')
require('dotenv').config()
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors({
  origin: [
    'http://localhost:5173',
    
  ],
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())

const logger = (req, res, next)=> {
  console.log(req.method, req.url);
  next()
}
const verifyToken = async(req,res, next)=> {
  const token = req.cookies?.token;
  if(!token){
    return res.status(401).send({message: 'not authorized'})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET,(err, decoded)=>{
    if(err){
      console.log(err);
      return res.status(401).send({message: 'unauthorized'})
    }
    //if token is valid then it would be decoded
    console.log('value in the token', decoded);
    res.user = decoded
    next()
  } )
 
}







const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uinjrty.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const database = client.db("assignmentDB");
    const topSellingCollection = database.collection("products");
    const cartCollection = database.collection("cart");
//auth related api
app.post('/api/v1/jwt', async(req,res)=>{
  const user = req.body;
  console.log(user);
  const token = jwt.sign(user, process.env.TOKEN, {expiresIn: '1h'})
  res.cookie('token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  })
  res.send({success: true})
})

app.post('/api/v1/logout', async(req,res)=>{
  const user = req.body;
  res.clearCookie('token', {maxAge: 0}).send({success: true})
})

//for home page 6 top-selling Food Items
app.post('/api/v1/post-items', async(req,res)=>{
  const product = req.body;
  const result = await topSellingCollection.insertOne(product)
  res.send(result)
})

app.get('/api/v1/get-added-food', async(req,res)=>{
  const email = req.query.email;
  if(req.query.email !== req.user.email){
    return res.status(403).send({message: 'forbidden access'})
  }

  const cursor = await topSellingCollection.find({ Email: email }).toArray();
  res.send(cursor)
})

//for get update data:
app.get('/api/v1/products/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await topSellingCollection.findOne(query);
  res.send(result)
})

// update operation
app.patch('/api/v1/products/:id',async(req,res)=>{
  const updateProduct = req.body;
  const id = req.params.id
  console.log(updateProduct);
  const filter = {_id: new ObjectId(id)};
  const updateDoc = {
    $set: {
      Country: updateProduct.Country,
      FoodCategory: updateProduct.FoodCategory,
      FoodImage: updateProduct.FoodImage,
      FoodName: updateProduct.FoodName,
      Quantity: updateProduct.Quantity,
      Price:  updateProduct.Price,
      ShortDescription: updateProduct.ShortDescription,
      LongDescription: updateProduct.LongDescription
    }
  }
  const result = await topSellingCollection.updateOne(filter,updateDoc)
  res.send(result)
})



//http://localhost:5000/api/v1/top-selling?sortField=price&sortOrder=desc
app.get('/api/v1/top-selling', async (req, res) => {
  try {
    let sortObj = {};
    const sortField = req.query.sortField;
    const sortOrder = req.query.sortOrder;

    if (sortField && sortOrder) {
      sortObj[sortField] = sortOrder;
    }

    const cursor = await topSellingCollection.find().sort(sortObj).limit(6).toArray();

    res.send(cursor);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// for all product api(20)
app.get('/api/v1/items', async(req,res)=>{
  console.log("pagination",req.query);
  const page = parseInt(req.query.page);
  const size = parseInt(req.query.size);
  const cursor = await topSellingCollection.find()
  .skip(page*size)
  .limit(size)
  .toArray()
  res.send(cursor)
})

app.get('/api/v1/items/:id', async(req,res)=>{
  const id = req.params.id;
  const query = { _id: new ObjectId(id)}
  const result = await topSellingCollection.findOne(query)
  res.send(result)
})

app.get('/api/v1/productsCount', async(req,res)=>{
  const count = await topSellingCollection.estimatedDocumentCount()
  console.log(count);
  res.send({count})
})


//for cart
app.post('/api/v1/cart', async(req,res)=>{
  const product = req.body;
  console.log(product)
  const result = await cartCollection.insertOne(product)
  res.send(result)
})

//get all cart items
app.get('/api/v1/cart', async(req,res)=>{
  const cursor = await cartCollection.find().toArray()
  res.send(cursor)
})

//delete cart
app.delete('/api/v1/cart/:id',async(req,res)=>{
  const id = req.params.id;
  const query = {_id: new ObjectId(id)}
  const result = await cartCollection.deleteOne(query);
  res.send(result)
})


app.put('/api/v1/update-count/:id', async (req, res) => {
  const body = req.body;
  const id = req.params.id;
  const Count = body.Count;
   const newCount = parseInt(Count)
   console.log(typeof newCount);
   const options = { upsert: true };
  const query = { _id: new ObjectId(id) };
  const update = {
    $inc: {
      Count: 1
    }
  };
    const result = await topSellingCollection.updateOne(query, update, options);
    console.log(result);
});




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})