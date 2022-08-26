import redis from "ioredis";

const client = new redis(6379, process.env.REDIS ?? "redis");
export default client;
