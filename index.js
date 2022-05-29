import express, { application } from "express";
import cors from "cors";
import "dotenv/config";
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";
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

        // verification for admin
        const isVerifiedAdmin = async (req, res, next) => {
            const authHeader = req.headers.authorization;

            if (authHeader) {
                const idToken = authHeader.split(" ")[1];
                admin
                    .auth()
                    .verifyIdToken(idToken)
                    .then(async (decodedToken) => {
                        const uid = decodedToken.uid;
                        const query = { uid: uid };
                        const field = "isAdmin";
                        const isAdmin = await usersCollection.distinct(
                            field,
                            query
                        );
                        console.log(isAdmin);
                        if (isAdmin[0]) {
                            return next();
                        } else {
                            return res.sendStatus(403);
                        }
                    })
                    .catch(function (error) {
                        console.log(error);
                        return res.sendStatus(403);
                    });
            } else {
                res.sendStatus(401);
            }
        };

        // verification for super admin
        const isVerifiedSuperAdmin = async (req, res, next) => {
            const authHeader = req.headers.authorization;

            if (authHeader) {
                const idToken = authHeader.split(" ")[1];
                admin
                    .auth()
                    .verifyIdToken(idToken)
                    .then(async (decodedToken) => {
                        const uid = decodedToken.uid;
                        const query = { uid: uid };
                        const field = "isSuperAdmin";
                        const isSuperAdmin = await usersCollection.distinct(
                            field,
                            query
                        );
                        console.log(isSuperAdmin);
                        if (isSuperAdmin[0]) {
                            return next();
                        } else {
                            return res.sendStatus(403);
                        }
                    })
                    .catch(function (error) {
                        console.log(error);
                        return res.sendStatus(403);
                    });
            } else {
                res.sendStatus(401);
            }
        };

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

        // api for adding a product
        app.post("/addproduct", isVerified, async (req, res) => {
            const data = req.body;
            const result = await productsCollection.insertOne(data);
            res.send(result);
        });

        // api for single product
        app.get("/product/:id", isVerified, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productsCollection.findOne(query);
            res.send(result);
        });

        // api for getting some product for homepage
        app.get("/homeproducts", async (req, res) => {
            const cursor = productsCollection.find();
            const result = await cursor.limit(6).toArray();
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
        app.get("/productscount", isVerifiedAdmin, async (req, res) => {
            const result = await productsCollection.estimatedDocumentCount();
            res.send({ count: result });
        });

        // api for delete product
        app.delete(
            "/deleteproduct/:id",
            isVerifiedSuperAdmin,
            async (req, res) => {
                const id = req.params.id;
                const query = { _id: ObjectId(id) };
                console.log(query);
                const result = await productsCollection.deleteOne(query);
                res.send(result);
            }
        );

        // api for order
        app.post("/order", isVerified, async (req, res) => {
            const data = req.data;
            const result = await ordersCollection.insertOne(data);
            res.send(result);
        });
    } finally {
    }
};

run().catch(console.dir);

app.listen(port, () => {
    console.log("Listening to port ", port);
});
