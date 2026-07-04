import { Agenda } from "agenda";
import { MongoBackend } from "@agendajs/mongo-backend";
import { RedisBackend } from "@agendajs/redis-backend";
import redis from "./redis";

const redisBackend = new RedisBackend({ redis });

(async function () {
  await redisBackend.connect();
})();

const agenda = new Agenda({
  backend: new MongoBackend({
    address: `${process.env.MONGOURL ?? "mongodb://mongo:27017"}/agenda`,
  }),
  notificationChannel: redisBackend.notificationChannel,
});

export default agenda;
