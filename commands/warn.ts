import {
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionsBitField,
} from "discord.js";
import mongo from "../mongo";
import { createHash, randomBytes } from "crypto";
const modlogStore = mongo.db("bot").collection("modlogs");

export = {
  name: "warn",
  privileged: true,
  async exec(i: ChatInputCommandInteraction): Promise<void> {
    const reason = i.options.getString("reason") ?? "No reason provided.";
    const user = i.options.getUser("user", true);
    const logId = createHash("sha256")
      .update(randomBytes(256))
      .digest("base64")
      .replaceAll("=", "")
      .replaceAll("/", "_")
      .replaceAll("+", "-");
    const logObj = {
      id: logId,
      moderator: `${i.user.tag} (${i.user.id})`,
      action: "warn",
      time: Date.now(),
      target: user.id,
      reason: reason,
    };
    await i.reply({ content: `Warned ${user.tag}`, ephemeral: true });
    const settings = await mongo
      .db("bot")
      .collection("settings")
      .findOne({ guild: i.guildId });
    if (!settings?.warnLogChannel) return;
    const channel = await i.guild?.channels.fetch(settings.warnLogChannel);
    if (
      !channel ||
      channel.type !== ChannelType.GuildText ||
      !i.appPermissions?.has(PermissionsBitField.Flags.SendMessages)
    )
      return;
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
    await modlogStore.insertOne(logObj);
    await channel.send({ embeds: [embed] });
  },
};
