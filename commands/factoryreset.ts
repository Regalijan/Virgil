import {
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionsBitField,
} from "discord.js";
import mongo from "../mongo";

export = {
  name: "factoryreset",
  async exec(i: ChatInputCommandInteraction): Promise<void> {
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
    const me = await i.guild?.members.me?.fetch();
    if (
      logChannel &&
      !me
        ?.permissionsIn(logChannel)
        .has(PermissionsBitField.Flags.SendMessages) &&
      logChannel.type === ChannelType.GuildText
    ) {
      const logEmbed = new EmbedBuilder()
        .setAuthor({
          name: i.user.tag,
          iconURL: i.user.displayAvatarURL(),
        })
        .setColor(serversettings.value?.commandLogChannel ?? 3756250)
        .setDescription("Requested factory reset.");

      await logChannel.send({ embeds: [logEmbed] });
    }
    await i.guild?.leave();
  },
};
