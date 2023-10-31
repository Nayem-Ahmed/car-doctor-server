const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const port = process.env.PORT || 5000;
const app = express()
require('dotenv').config()

app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}))
app.use(express.json());
app.use(cookieParser())


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
// own middlewares
const logger = async (req, res, next) => {
  console.log('called', req.host, req.originalUrl);
  next()
}

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: 'token nai access nai' })

  }
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'access nai' })

    }
    console.log('value in the token', decoded);
    req.user = decoded
    next()
  })


}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const servicecollection = client.db('cardoctor').collection('services');
    const ordercollection = client.db('cardoctor').collection('order');

    // auth related/joot

    app.post('/jwt', logger, async (req, res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: false,
        })
        .send({ success: true })
    })

    app.post('/logout', async (req, res) => {
      const user = req.body
      res.clearCookie('token', {
        httpOnly: true,
        secure: false,
      }).send({ success: true })

    })


    // services
    app.get('/services', logger, async (req, res) => {
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

    app.get('/orders', logger, verifyToken, async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email }

      }
      const result = await ordercollection.find(query).toArray();
      res.send(result)

    })


    app.post('/orders', async (req, res) => {
      const order = req.body;
      const result = await ordercollection.insertOne(order);
      res.send(result)

    })

    app.patch('/orders/:id', async (req, res) => {
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const updateOrder = req.body
      const Order = {
        $set: {
          status: updateOrder.status,

        }
      }
      const result = await ordercollection.updateOne(filter, Order)
      res.send(result)

    })

    app.delete('/orders/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
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