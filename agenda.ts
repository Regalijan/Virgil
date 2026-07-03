import { Agenda } from "agenda";
import { MongoBackend } from "@agendajs/mongo-backend";
import { RedisBackend } from "@agendajs/redis-backend";

const redisBackend = new RedisBackend({
  connectionString: process.env.REDIS ?? "redis://redis:6379",
});
const agenda = new Agenda({
  backend: new MongoBackend({
    address: `${process.env.MONGOURL ?? "mongodb://mongo:27017"}/agenda`,
  }),
  notificationChannel: redisBackend.notificationChannel,
});

export default agenda;
