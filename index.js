import express from "express";
import cors from "cors";
import "dotenv/config";
import { MongoClient, ServerApiVersion } from "mongodb";
import admin from "./admin.js";
import isVerified from "./verifyToken.js";

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

app.get("/", (req, res) => {
    console.log(req.headers);
    res.send("Server has started and running.");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@toolex.odxcz.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
});

const run = async () => {
    try {
        await client.connect();
        console.log("db connected");
        const productsCollection = client.db("toolex").collection("products");
        const usersCollection = client.db("toolex").collection("users");
        const ordersCollection = client.db("toolex").collection("orders");
        const reviewsCollection = client.db("toolex").collection("reviews");

        // api for login system
        app.post("/login", async (req, res) => {
            const body = req.body;
            console.log(body);
            const filter = { uid: body.uid };
            const updateDoc = {
                $set: body,
            };
            const options = { upsert: true };
            const result = await usersCollection.updateOne(
                filter,
                updateDoc,
                options
            );
            res.send(result);
        });

        // api for logout system
        app.post("/logout", async (req, res) => {
            const loggedIn = req.body.loggedIn;
            const uid = req.body.uid;
            const filter = { uid };
            const doc = { $set: { loggedIn } };
            const result = await usersCollection.updateOne(filter, doc);
            res.send(result);
        });

        app.post("/addproduct", isVerified, async (req, res) => {
            const data = req.body;
            const result = await productsCollection.insertOne(data);
            res.send(result);
        });

        // api for getting all products
        app.get("/products", isVerified, async (req, res) => {
            console.log("query: ", req.query);
            const size = parseInt(req.query.size);
            const page = parseInt(req.query.page);
            const query = {};
            const cursor = productsCollection.find(query);
            let products;
            if (page || size) {
                products = await cursor
                    .skip(page * size)
                    .limit(size)
                    .toArray();
            } else {
                products = await cursor.toArray();
            }
            res.send(products);
        });

        // api for getting number of products
        app.get("/productscount", isVerified, async (req, res) => {
            const result = await productsCollection.estimatedDocumentCount();
            res.send({ count: result });
        });
    } finally {
    }
};

run().catch(console.dir);

app.listen(port, () => {
    console.log("Listening to port ", port);
});
