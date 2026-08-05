import redis from "ioredis";

const client = new redis({
  port: 6379,
  host: process.env.REDIS ?? "redis",
  protocol: 3,
  replyMapping: "resp3",
});
export default client;
