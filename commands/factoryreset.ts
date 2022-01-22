import { CommandInteraction, MessageEmbed } from "discord.js";
import mongo from "../mongo";

export = {
  name: "factoryreset",
  description: "Erases all settings of the bot and leaves the server",
  permissions: ["ADMINISTRATOR"],
  interactionData: {
    name: "factoryreset",
    description: "Erases all settings of the bot and leaves the server",
  },
  async exec(i: CommandInteraction): Promise<void> {
    const serversettings = await mongo
      .db("bot")
      .collection("settings")
      .findOneAndDelete({ server: i.guildId });
    await mongo.db("bot").collection("binds").deleteMany({ server: i.guildId });
    await i.reply({
      content: "Settings deleted! Leaving the server...",
      ephemeral: true,
    });
    const logChannel = await i.guild?.channels
      .fetch(serversettings.value?.commandLogChannel)
      .catch((e) => console.error(e));
    const me = await i.guild?.me?.fetch();
    if (
      logChannel &&
      !me?.permissionsIn(logChannel).has("SEND_MESSAGES") &&
      logChannel.type === "GUILD_TEXT"
    ) {
      const logEmbed = new MessageEmbed()
        .setAuthor({
          name: i.user.tag,
          iconURL: i.user.displayAvatarURL({ dynamic: true }),
        })
        .setColor(serversettings.value?.commandLogChannel ?? 3756250)
        .setDescription("Requested factory reset.");

      await logChannel.send({ embeds: [logEmbed] });
    }
    await i.guild?.leave();
  },
};
