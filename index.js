const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const app = express()
require('dotenv').config()


app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
  res.send('Hello World!')
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8wqrrau.mongodb.net/?retryWrites=true&w=majority`;

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

    const servicecollection = client.db('cardoctor').collection('services');
    const ordercollection = client.db('cardoctor').collection('order');

    app.get('/services', async (req, res) => {
      const cursor = servicecollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })

    app.get('/services/:id', async (req, res) => {
      const id = req.params.id;
      // const options = {
      //   // Include only the `title` and `imdb` fields in each returned document
      //   projection: {title: 1, price: 1,img:1 },
      // };
      const query = { _id: new ObjectId(id) }
      const order = await servicecollection.findOne(query)
      res.send(order)
      
    })

    // order

    app.get('/orders', async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = {email: req.query.email}
        
      }
      const result = await ordercollection.find(query).toArray();
      res.send(result)
      
    })


    app.post('/orders', async(req,res)=>{
      const order = req.body;
      const result = await ordercollection.insertOne(order);
      res.send(result)

    })

    app.patch('/orders/:id',async(req,res)=>{
      const id = req.params.id
      const filter = {_id: new ObjectId(id)}
      const updateOrder = req.body
      const Order = {
        $set: {
           status: updateOrder.status,
 
        }
      }
      const result = await ordercollection.updateOne(filter, Order)
      res.send(result)

    })

    app.delete('/orders/:id', async(req,res)=>{
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await ordercollection.deleteOne(query);
      res.send(result)

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



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})