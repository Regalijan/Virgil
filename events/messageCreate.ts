import { Message } from "discord.js";
import db from "../mongo";
import Sentry from "../sentry";
import redis from "../redis";
import axios from "axios";
import { randomBytes } from "crypto";
import { Agent } from "https";

const mongo = db.db("bot");

module.exports = async function (message: Message) {
  if (
    !message.content ||
    !message.author ||
    message.channel.type !== "GUILD_TEXT"
  )
    return;
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: message.guildId })
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (!settings?.antiphish) return;
  const linkMatches = message.content.match(
    /https?:\/\/(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/g
  );
  if (!linkMatches) return;
  for (let link of linkMatches) {
    let malicious = false;
    const cache = await redis
      .get(`linkcheck_${link.replace(/^https?:\/\//, "")}`)
      .catch((e) => {
        process.env.DSN ? Sentry.captureException(e) : console.error(e);
      });
    if (!cache) {
      const redirReq = await axios(link, {
        headers: {
          "user-agent": Buffer.from(randomBytes(16)).toString("base64"), // Prevent UA blocking
        },
        httpsAgent: new Agent({ rejectUnauthorized: false }), // Prevent self-signed certs from breaking validation
        validateStatus: () => true,
      }).catch((e) => {
        process.env.DSN ? Sentry.captureException(e) : console.error(e);
      }); // Axios will follow up to 5 redirects by default
      if (!redirReq) continue;
      link = redirReq.request.host;
      const phishCheckReq = await axios(
        `https://api.phisherman.gg/v1/domains/${link}`,
        {
          headers: {
            "user-agent": "Virgil Bot +https://github.com/Wolftallemo/Virgil",
          },
          validateStatus: () => true,
        }
      ).catch((e) => {
        process.env.DSN ? Sentry.captureException(e) : console.error(e);
      });
      if (phishCheckReq?.status !== 200) continue;
      if (phishCheckReq.data) malicious = true;
      await redis
        .set(
          `linkcheck_${link}`,
          JSON.stringify(phishCheckReq.data),
          "EX",
          1800
        )
        .catch((e) => {
          process.env.DSN ? Sentry.captureException(e) : console.error(e);
        });
    } else {
      malicious = JSON.parse(cache);
    }
    if (malicious) {
      if (message.deletable) {
        await message.delete().catch((e) => {
          process.env.DSN ? Sentry.captureException(e) : console.error(e);
        });
      }
      if (!settings?.autobanPhishers) return;
      const member =
        message.member ||
        (await message.guild?.members.fetch(message.author.id).catch((e) => {
          process.env.DSN ? Sentry.captureException(e) : console.error(e);
        }));
      if (!member?.bannable) return;
      await member.send({
        content: `You were banned from ${
          message.guild?.name
        } for sending a phishing link.${
          settings.antiphishMessage ? "\n\n" + settings.antiphishMessage : ""
        }`,
      });
      await member
        .ban({ reason: "User posted a phishing link", days: 1 })
        .catch((e) => {
          process.env.DSN ? Sentry.captureException(e) : console.error(e);
        });
      break;
    }
  }
};
