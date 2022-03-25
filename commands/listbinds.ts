import { CommandInteraction, GuildMember, MessageEmbed } from "discord.js";
import mongo from "../mongo";

const binds = mongo.db("bot").collection("binds");

export = {
  name: "listbinds",
  description: "Shows all server binds",
  interactionData: {
    name: "listbinds",
    name_localizations: {
      "es-ES": "listar_enlaces",
      "sv-SE": "lista_länkar",
    },
    description: "Shows all server binds",
    description_localizations: {
      "es-ES": "Muestra todos los enlaces del servidor",
      "sv-SE": "Visa alla serverlänkar",
    },
  },
  async exec(i: CommandInteraction): Promise<void> {
    if (!i.guildId)
      throw Error(
        "<CommandInteraction>.guildId was null despite command being run in a guild."
      );
    const bindsList = await binds.find({ server: i.guildId }).toArray();
    const embed = new MessageEmbed().setDescription(
      bindsList.length
        ? "List of binds for this server"
        : "No binds are set for this server"
    );
    if (i.member instanceof GuildMember) embed.setColor(i.member.displayColor);
    for (const bind of bindsList) {
      let bindString = bind.type[0].toUpperCase() + bind.type.slice(1);
      if (bind.group)
        bindString += ` ${bind.group} - ${
          bind.rank ? `Rank ${bind.rank}` : "All ranks"
        }`;
      if (bind.asset) bindString += ` ${bind.asset}`;
      embed.addField(bindString, `<@&${bind.role}>\nBind ID: ${bind.id}`);
    }
    await i.reply({ embeds: [embed] });
  },
};
