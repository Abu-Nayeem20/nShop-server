const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();

const Stripe = require('stripe');
const stripe = Stripe(`${process.env.STRIPE_SECRET}`);

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.f1hps.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        const database = client.db('nShopDB');
        const productsCollection = database.collection('products');
        const usersCollection = database.collection('users');
        const ordersCollection = database.collection('orders');

        // GET PRODUCTS API 
        app.get('/products', async (req, res) => {
            const cursor = productsCollection.find({});
            const products = await cursor.toArray();
            res.send(products);
        });
         // GET API FOR A SINGLE PRODUCT
         app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await productsCollection.findOne(query);
            res.json(product);
        });

        // UPDATE API FOR USERS
        app.put('/users', async (req, res) => {
            const user = req.body;
            // console.log(user);
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        // POST API FOR ORDERS
        app.post('/orders', async (req, res) => {
            const order = req.body;
            const newOrder = {...order, status: "Pending"};
            const result = await ordersCollection.insertOne(newOrder);
            // console.log("new order added");
            res.json(result);
        });

        // GET ORDERS API FOR SINGLE USER
        app.get('/orders', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
        
            const cursor = ordersCollection.find(query);
            const orders = await cursor.toArray();
            res.json(orders);
        });
         // GET API FOR A SINGLE ORDER
         app.get('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const order = await ordersCollection.findOne(query);
            res.json(order);
        });

        // UPDATE API FOR CONFIRM PAYMENT
        app.put('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const filter = { _id: ObjectId(id) };
            const updatedDoc = {
                $set: {
                    payment: payment
                }
            };
            const result = await ordersCollection.updateOne(filter, updatedDoc);
            res.json(result);
        });

        // STRIPE PAYMENT API
        app.post('/create-payment-intent', async (req, res) => {
            const paymentInfo = req.body;
            const amount = paymentInfo.price * 100;
          
            const paymentIntent = await stripe.paymentIntents.create({
              amount: amount,
              currency: 'usd',
              payment_method_types: ['card']
            });
            // console.log(paymentIntent.client_secret)
            res.send({
              clientSecret: paymentIntent.client_secret,
            });
          });

    }
    finally {
        // await client.close();
    }

}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send("nShop Server in running");
});

app.listen(port, () => {
    console.log("nShop server port", port);
});