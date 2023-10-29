import { ChatInputCommandInteraction, PermissionsBitField } from "discord.js";
import mongo from "../mongo";

export = {
  name: "selfban",
  async exec(i: ChatInputCommandInteraction): Promise<void> {
    if (!i.appPermissions?.has(PermissionsBitField.Flags.BanMembers)) {
      await i.reply({
        content:
          "I was unable to run this command because I do not have the Ban Members permission.",
        ephemeral: true,
      });
      return;
    }

    const chance = Math.random() <= 1 / 10000;
    if (chance) {
      const target = await i.guild?.members.fetch(i.user);
      if (
        !target?.bannable ||
        !i.guild?.members.me ||
        target.roles.highest.comparePositionTo(
          i.guild.members.me.roles.highest,
        ) >= 0
      ) {
        await i.reply("This user cannot be banned.");
        return;
      }

      let aheadToUnban = Math.round(Math.random() * 10) * 1440 * 60000;
      await target
        .send({
          content: `You have been banned from ${i.guild?.name} for the following reason:\n\nSelf-ban`,
        })
        .catch((e) => console.error(e));
      await i.reply({
        content: `${i.user} banned himself successfully.`,
      });
      await target.ban({
        reason: "Natural Selection",
      });
      aheadToUnban += Date.now();
      await mongo
        .db("bot")
        .collection("bans")
        .insertOne({ server: i.guildId, unban: aheadToUnban, user: target.id });
    } else {
      await i.reply({
        content: "Try again.",
        ephemeral: true,
      });
    }
  },
};
