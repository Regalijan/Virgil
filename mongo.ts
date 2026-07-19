import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGOURL ?? "mongodb://mongo:27017");
export default client;
