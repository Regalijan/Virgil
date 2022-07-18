import {
  ChannelType,
  Message,
  PermissionsBitField,
  Team,
  TextChannel,
} from "discord.js";
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
    message.channel.type === ChannelType.DM
  )
    return;
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: message.guildId })
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  const bypasses = await mongo
    .collection("filter_bypass")
    .find({ server: message.guildId })
    .toArray();
  if (
    bypasses.find(
      (b) =>
        b.id === message.channel.id ||
        b.id === message.author.id ||
        b.id === message.channel ||
        (message.channel instanceof TextChannel &&
          b.id === message.channel.parentId) ||
        message.member?.roles.cache.has(b.id)
    )
  )
    return;
  if (
    !message.member?.permissions.has(PermissionsBitField.Flags.Administrator) &&
    message.guild.members.me &&
    message.channel
      .permissionsFor(message.guild.members.me)
      ?.has(PermissionsBitField.Flags.ManageMessages)
  ) {
    try {
      const banned_words = await mongo
        .collection("banned_words")
        .find({ server: message.guildId });

      for (const word of await banned_words.toArray()) {
        if (word.type === 1) {
          // Exact matches
          if (
            (message.content === word.filter ||
              (!word.case_sensitive &&
                message.content.toLowerCase() === word.filter.toLowerCase())) &&
            message.deletable
          ) {
            await message.delete();
            return;
          }
        } else if (word.type === 2) {
          // Wildcard matches
          if (
            (message.content.search(word.filter) > -1 ||
              (!word.case_sensitive &&
                message.content
                  .toLowerCase()
                  .search(word.filter.toLowerCase()))) &&
            message.deletable
          ) {
            await message.delete();
            return;
          }
        }
      }
    } catch (e) {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    }
  }
  if (!settings?.antiphish) return;
  const linkMatches = message.content.match(
    /https?:\/\/(?:[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?\.)+[a-z\d[a-z\d-]{0,61}[a-z\d]/g
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
        .ban({ reason: "User posted a phishing link", deleteMessageDays: 1 })
        .catch((e) => {
          process.env.DSN ? Sentry.captureException(e) : console.error(e);
        });
      break;
    }
  }
};
