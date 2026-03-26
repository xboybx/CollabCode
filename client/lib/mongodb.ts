import { MongoClient } from "mongodb";

// 1. Safety Check: Guarantee the app crashes early if we forgot our database connection string.
if (!process.env.MONGODB_URI) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI;
const options = {};

// `client` holds the physical connection tools.
// `clientPromise` holds the active, in-progress connection.
let client;
let clientPromise: Promise<MongoClient>

// 2. The Big "Why": Development vs Production
if (process.env.NODE_ENV == "development") {
    /* 
      THE PROBLEM:
      In Next.js, pressing CTRL+S triggers "Fast Refresh", which completely restarts this file.
      If we ran `new MongoClient().connect()` on every save, we would spam our MongoDB database 
      with hundreds of connections and instantly crash our free tier limit ("Too Many Connections").
      
      THE SOLUTION (Global Cache Hack):
      Fast Refresh destroys files/variables, but it preserves Node.js `global` memory!
      We create a type-safe hiding spot `globalWithMongo` to stash our database connection.
    */
    let globalWithMongo = global as typeof globalThis & {
        _mongoClientPromise?: Promise<MongoClient>
    }

    if (!globalWithMongo._mongoClientPromise) {
        // First save! Establish the connection and save it in our global memory hiding spot.
        client = new MongoClient(uri, options);
        globalWithMongo._mongoClientPromise = client.connect();
        //This promise will have the resolve state with the active mongodb tcp connection and its oject
    }

    // 2nd, 3rd, 50th save! "Ah, I already have a connection running in global memory! I'll just reuse that."
    clientPromise = globalWithMongo._mongoClientPromise;
} else {
    /* 
      PRODUCTION:
      When deployed to the real world (e.g. Vercel), there is no Fast Refresh!
      We don't need the global memory hack; we just establish a normal, robust, single connection.
    */
    client = new MongoClient(uri, options);
    clientPromise = client.connect()
}

// NextAuth will use this exported promise to connect to MongoDB and save users!
export default clientPromise

