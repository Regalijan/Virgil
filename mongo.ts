import { config as dotenv } from "dotenv";
import { MongoClient } from "mongodb";

dotenv();

const client = new MongoClient(process.env.MONGOURL ?? "mongodb://mongo:27017");
export default client;
