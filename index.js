const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();
const fileUpload = require('express-fileupload');

const Stripe = require('stripe');
const stripe = Stripe(`${process.env.STRIPE_SECRET}`);

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());

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

        // GET USERS API 
        app.get('/allUsers', async (req, res) => {
            const cursor = usersCollection.find({});
            const users = await cursor.toArray();
            res.send(users);
        });

         // UPDATE API FOR ORDERS
         app.put('/allUsers/:id', async (req, res) => {
            const id = req.params.id;
            const updatedUser = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    role: updatedUser.role
                }
            };
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.json(result);
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

        // POST API FOR PRODUCT
        app.post('/products', async (req, res) => {
            const name = req.body.name;
            const price = req.body.price;
            const category = req.body.category;
            const stock = req.body.stock;
            const desc = req.body.desc;
            const img = req.files.img;
            const imgData = img.data;
            const encodedImg = imgData.toString('base64');
            const imageBuffer = Buffer.from(encodedImg, 'base64');
            const product = {
                name,
                price,
                category,
                stock,
                desc,
                img: imageBuffer
            }
            const result = await productsCollection.insertOne(product);
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

         // GET ORDERS API FOR ADMIN
         app.get('/allOrders', async (req, res) => {
            const cursor = ordersCollection.find({});
            const allOrders = await cursor.toArray();
            res.send(allOrders);
        });

         // UPDATE API FOR ORDERS
         app.put('/allOrders/:id', async (req, res) => {
            const id = req.params.id;
            const updatedOrder = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    status: updatedOrder.status
                }
            };
            const result = await ordersCollection.updateOne(filter, updatedDoc, options);
            res.json(result);
        });

         // GET API FOR A SINGLE ORDER
         app.get('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const order = await ordersCollection.findOne(query);
            res.json(order);
        });

        // DELETE API FOR PRODUCT
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(query);
            res.json(result);
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