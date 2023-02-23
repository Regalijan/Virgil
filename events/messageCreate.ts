import {DMChannel, Message, Team} from "discord.js";
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
    !message.guild ||
    message.channel.type === "DM"
  )
    return;
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: message.guildId })
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (message.guild.me && message.channel.permissionsFor(message.guild.me).has("MANAGE_MESSAGES")) {
    try {
      const banned_words = await mongo
          .collection("banned_words")
          .find({server: message.guildId});

      await banned_words.forEach(word => {
        if (word.type === 1) { // Exact matches
          if (message.content === word.filter || !word.case_sensitive && message.content.toLowerCase() === word.filter.toLowerCase()) {

          }
        }
      })
    } catch (e) {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    }
  }
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
            "user-agent": `Virgil Bot (+https://github.com/Wolftallemo/Virgil / ${
              message.client.application?.owner instanceof Team
                ? message.client.application.owner.members.first()?.id
                : message.client.application?.owner?.id
            })`,
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
      if (
        process.env.ROVER_REGISTRY_KEY &&
        process.env.ROVER_REGISTRY_UNLINK_URL
      ) {
        await axios(
          process.env.ROVER_REGISTRY_UNLINK_URL + `/${message.author.id}`,
          {
            method: "DELETE",
            headers: {
              authorization: `Bearer ${process.env.ROVER_REGISTRY_KEY}`,
            },
            validateStatus: () => true,
          }
        );
      }
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
