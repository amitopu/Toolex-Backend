import express from "express";
import cors from "cors";
import "dotenv/config";
import { MongoClient, ServerApiVersion } from "mongodb";

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

app.get("/", (req, res) => {
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
    } finally {
    }
};

run().catch(console.dir);

app.listen(port, () => {
    console.log("Listening to port ", port);
});