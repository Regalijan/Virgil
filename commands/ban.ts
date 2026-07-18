import {
  ChatInputCommandInteraction,
  MessageFlagsBitField,
  PermissionsBitField,
} from "discord.js";
import mongo from "../mongo";
import agenda from "../agenda";

export = {
  name: "ban",
  privileged: true,
  async exec(i: ChatInputCommandInteraction): Promise<void> {
    if (!i.appPermissions?.has(PermissionsBitField.Flags.BanMembers)) {
      await i.reply({
        content:
          "I was unable to ban this user because I do not have the Ban Members permission.",
        flags: [MessageFlagsBitField.Flags.Ephemeral],
      });
      return;
    }

    const target = await i.guild?.members.fetch(
      i.options.getUser("user", true),
    );
    if (
      !target?.bannable ||
      target.id === i.user.id ||
      !i.guild?.members.me ||
      target.roles.highest.comparePositionTo(
        i.guild.members.me.roles.highest,
      ) <= 0
    ) {
      await i.reply("This user cannot be banned.");
      return;
    }

    const settings = await mongo
      .db("bot")
      .collection("ban_messages")
      .findOne({ guild: i.guild.id }, { projection: { message_content: 1 } });

    let aheadToUnban = 0;
    const minutes = i.options.getInteger("minutes", false);
    if (minutes) aheadToUnban += minutes * 60000;
    const hours = i.options.getInteger("hours", false);
    if (hours) aheadToUnban += hours * 60 * 60000;
    const days = i.options.getInteger("days", false);
    if (days) aheadToUnban += days * 1440 * 60000;

    let banMessage = `You have been banned from ${
      i.guild?.name
    } for the following reason:\n\n${i.options.getString("reason")}`;

    if (settings?.message_content) banMessage += `\n\n${banMessage}`;

    await target
      .send({
        content: banMessage,
      })
      .catch((e) => console.error(e));
    await target.ban({
      reason: i.options.getString("reason", false) ?? "No reason provided.",
    });
    if (!aheadToUnban) return;
    aheadToUnban += Date.now();
    await agenda.schedule(new Date(aheadToUnban), "clear-temporary-ban", {
      server: i.guildId,
      user: target.id,
    });
  },
};
