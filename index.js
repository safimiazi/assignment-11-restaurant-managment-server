const express = require('express')
const app = express()
var cors = require('cors')
require('dotenv').config()
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors())
app.use(express.json())

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



//for home page 6 top-selling Food Items
app.post('/api/v1/post-items', async(req,res)=>{
  const product = req.body;
  const result = await topSellingCollection.insertOne(product)
  res.send(result)
})

app.get('/api/v1/get-added-food', async(req,res)=>{
  const email = req.query.email;
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