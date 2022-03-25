import { CommandInteraction, MessageEmbed } from "discord.js";
import mongo from "../mongo";
import { createHash, randomBytes } from "crypto";
const modlogStore = mongo.db("bot").collection("modlogs");

export = {
  name: "warn",
  permissions: ["MANAGE_MESSAGES"],
  interactionData: {
    name: "warn",
    name_localizations: {
      "es-ES": "advertencia",
      "sv-SE": "varna",
    },
    description: "Warn a user for misbehavior",
    description_localizations: {
      "es-ES": "Advertir a un usuario por comportamiento inadecuado",
      "sv-SE": "Varna en användare för misstänkt misföra",
    },
    options: [
      {
        type: 6,
        name: "user",
        name_localizations: {
          "es-ES": "usuario",
          "sv-SE": "användare",
        },
        description: "User to warn",
        description_localizations: {
          "es-ES": "Usuario a advertir",
          "sv-SE": "Användare att varna",
        },
        required: true,
      },
      {
        type: 3,
        name: "reason",
        name_localizations: {
          "es-ES": "razón",
          "sv-SE": "orsak",
        },
        description: "Reason for warn",
        description_localizations: {
          "es-ES": "Razón de la advertencia",
          "sv-SE": "Orsak till varning",
        },
      },
    ],
  },
  privileged: true,

  async exec(i: CommandInteraction): Promise<void> {
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
      channel.type !== "GUILD_TEXT" ||
      !i.guild?.me?.permissionsIn(channel).has("SEND_MESSAGES")
    )
      return;
    const member = await i.guild.members.fetch(i.user.id);
    const embed = new MessageEmbed()
      .setTitle("Member Warned")
      .setAuthor({
        name: user.tag,
        iconURL: user.displayAvatarURL({ dynamic: true }),
      })
      .addFields(
        { name: "Member", value: `<@${user.id}> (${user.id})` },
        { name: "Moderator", value: `<@${i.user.id}> (${i.user.id})` },
        { name: "Reason", value: reason }
      );
    embed.setColor(member.displayColor);
    await modlogStore.insertOne(logObj);
    await channel.send({ embeds: [embed] });
  },
};
