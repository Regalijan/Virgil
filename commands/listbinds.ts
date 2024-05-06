import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember
} from "discord.js";
import mongo from "../mongo";

const binds = mongo.db("bot").collection("binds");

export = {
  name: "listbinds",
  description: "Shows all server binds",
  async exec(i: ChatInputCommandInteraction): Promise<void> {
    if (!i.guildId)
      throw Error(
        "<CommandInteraction>.guildId was null despite command being run in a guild.",
      );
    const bindsList = await binds.find({ server: i.guildId }).toArray();
    const embed = new EmbedBuilder().setDescription(
      bindsList.length
        ? "List of binds for this server"
        : "No binds are set for this server",
    );
    if (i.member instanceof GuildMember) embed.setColor(i.member.displayColor);
    for (const bind of bindsList) {
      let bindString = bind.type[0].toUpperCase() + bind.type.slice(1);
      if (bind.group)
        bindString += ` ${bind.group} - ${
          bind.rank ? `Rank ${bind.rank}` : "All ranks"
        }`;
      if (bind.asset) bindString += ` ${bind.asset}`;
      embed.addFields({
        name: bindString,
        value: `<@&${bind.role}>\nBind ID: ${bind.id}`,
      });
    }
    await i.reply({ embeds: [embed] });
  },
};
