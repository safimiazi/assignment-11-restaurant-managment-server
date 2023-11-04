const express = require('express')
const app = express()
var cors = require('cors')
require('dotenv').config()
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion } = require('mongodb');

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

//for home page 6 top-selling Food Items
//http://localhost:5000/api/v1/top-selling?sortField=price&sortOrder=desc
app.get('/api/v1/top-selling', async(req, res)=>{
 
  let sortObj = {}
  const sortField = req.query.sortField;
  const sortOrder = req.query.sortOrder;
  if(sortField && sortOrder){
    sortObj[sortField] = sortOrder
  }
  console.log(sortObj)
  const cursor =await topSellingCollection.find().sort(sortObj).limit(6).toArray()
  res.send(cursor)
  
   
})










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