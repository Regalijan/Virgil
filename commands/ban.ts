import { CommandInteraction } from "discord.js";
import mongo from "../mongo";

export = {
  name: "ban",
  permissions: ["BAN_MEMBERS"],
  interactionData: {
    name: "ban",
    name_localizations: {
      "es-ES": "banear",
      "sv-SE": "bannlys",
    },
    description: "Ban a user",
    description_localizations: {
      "es-ES": "Banear a un usuario",
      "sv-SE": "Bannlys en användare",
    },
    options: [
      {
        type: 6,
        name: "user",
        name_localizations: {
          "es-ES": "usuario",
          "sv-SE": "användare",
        },
        description: "User to ban",
        description_localizations: {
          "es-ES": "Usuario a banear",
          "sv-SE": "Användare att bannlysa",
        },
        required: true,
      },
      {
        type: 4,
        name: "days",
        name_localizations: {
          "es-ES": "días",
          "sv-SE": "dagar",
        },
        description: "Days to ban user",
        description_localizations: {
          "es-ES": "Días a banear al usuario",
          "sv-SE": "Dagar att bannlysa användaren",
        },
      },
      {
        type: 4,
        name: "hours",
        name_localizations: {
          "es-ES": "horas",
          "sv-SE": "timmar",
        },
        description: "Hours to ban user",
        description_localizations: {
          "es-ES": "Horas a banear al usuario",
          "sv-SE": "Timmar att bannlysa användaren",
        },
      },
      {
        type: 4,
        name: "minutes",
        name_localizations: {
          "es-ES": "minutos",
          "sv-SE": "minuter",
        },
        description: "Minutes to ban user",
        description_localizations: {
          "es-ES": "Minutos a banear al usuario",
          "sv-SE": "Minuter att bannlysa användaren",
        },
      },
    ],
  },
  privileged: true,
  async exec(i: CommandInteraction): Promise<void> {
    if (!i.guild?.me?.permissions.has("BAN_MEMBERS")) {
      await i.reply({
        content:
          "I was unable to ban this user because I do not have the Ban Members permission.",
        ephemeral: true,
      });
      return;
    }

    const target = await i.guild.members.fetch(i.options.getUser("user", true));
    if (
      !target.bannable ||
      target.id === i.user.id ||
      target.roles.highest.comparePositionTo(target.roles.highest) <= 0
    ) {
      await i.reply("This user cannot be banned.");
      return;
    }

    let aheadToUnban = 0;
    const minutes = i.options.getInteger("minutes", false);
    if (minutes) aheadToUnban += minutes * 60000;
    const hours = i.options.getInteger("hours", false);
    if (hours) aheadToUnban += hours * 60 * 60000;
    const days = i.options.getInteger("days", false);
    if (days) aheadToUnban += days * 1440 * 60000;
    await target
      .send({
        content: `You have been banned from ${
          i.guild.name
        } for the following reason:\n\n${i.options.getString("reason")}`,
      })
      .catch((e) => console.error(e));
    await target.ban({
      reason: i.options.getString("reason", false) ?? "No reason provided.",
    });
    if (!aheadToUnban) return;
    aheadToUnban += Date.now();
    await mongo
      .db("bot")
      .collection("bans")
      .insertOne({ server: i.guildId, unban: aheadToUnban, user: target.id });
  },
};
