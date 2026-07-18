import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlagsBitField,
} from "discord.js";
import mongo from "../mongo";
import sendLog from "../send_log";
import logger from "../logger";
const modLogStore = mongo.db("bot").collection("modlogs");

export = {
  name: "warn",
  privileged: true,
  async exec(i: ChatInputCommandInteraction): Promise<void> {
    if (!i.guild) return;

    const reason = i.options.getString("reason") ?? "No reason provided.";
    const user = i.options.getUser("user", true);
    const logObj = {
      moderator: `${i.user.tag} (${i.user.id})`,
      action: "warn",
      time: Date.now(),
      target: user.id,
      reason: reason,
    };

    await modLogStore.insertOne(logObj);
    await i.reply({
      content: `Warned ${user.tag}`,
      flags: [MessageFlagsBitField.Flags.Ephemeral],
    });

    const warnLogResult = await mongo
      .db("bot")
      .collection("log_channels")
      .findOne({ guild: i.guildId, type: "warn" });

    if (!warnLogResult?.webhook) return;

    const member = await i.guild?.members.fetch(i.user.id);
    const embed = new EmbedBuilder()
      .setTitle("Member Warned")
      .setAuthor({
        name: user.tag,
        iconURL: user.displayAvatarURL(),
      })
      .addFields(
        { name: "Member", value: `<@${user.id}> (${user.id})` },
        { name: "Moderator", value: `<@${i.user.id}> (${i.user.id})` },
        { name: "Reason", value: reason },
      );
    embed.setColor(member?.displayColor ?? 0);

    try {
      await sendLog(warnLogResult.webhook, embed, i.guild, "warn");
    } catch (e) {
      logger(e);
    }

    try {
      await user.send({
        content: `You have been warned in ${i.guild?.name} for the following reason: ${reason}\n\nPlease contact server staff if you think this was a mistake.`,
      });
    } catch {}
  },
};
