import { CommandInteraction } from "discord.js";
import mongo from "../mongo";

export = {
  name: "ban",
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
