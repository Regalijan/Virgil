import { CommandInteraction, MessageEmbed } from "discord.js";
import mongo from "../mongo";
const settings = mongo.db("bot").collection("settings");

export = {
  name: "antiphish",
  permissions: ["MANAGE_GUILD"],
  interactionData: {
    name: "antiphish",
    description: "Change anti-phishing settings",
    options: [
      {
        type: 1,
        name: "status",
        description: "View current anti-phishing settings",
      },
      {
        type: 1,
        name: "toggle-antiphish",
        description: "Toggle anti-phishing protection",
      },
      {
        type: 1,
        name: "toggle-autoban",
        description: "Toggle auto-banning of phishers",
      },
    ],
  },
  async exec(i: CommandInteraction): Promise<void> {
    const subcommand = i.options.getSubcommand(true);
    const phishSettings = await settings.findOne({ guild: i.guildId });
    if (!phishSettings)
      return await i.reply({
        content: "Server settings have not been initialized!",
        ephemeral: true,
      });
    switch (subcommand) {
      case "status":
        const embed = new MessageEmbed()
          .setAuthor(i.user.tag, i.user.displayAvatarURL({ dynamic: true }))
          .setDescription("Anti-phishing settings status")
          .addFields(
            {
              name: "Anti-Phishing Core",
              value: phishSettings?.antiphish ? "Enabled" : "Disabled",
            },
            {
              name: "Autoban",
              value: phishSettings?.autobanPhishers ? "Enabled" : "Disabled",
            }
          );

        await i.reply({ embeds: [embed] });
        break;

      case "toggle-antiphish":
        phishSettings.antiphish = !phishSettings.antiphish;
        await settings.replaceOne({ guild: i.guildId }, phishSettings);
        await i.reply({
          content:
            "Anti-phishing has been " + phishSettings.antiphish
              ? "enabled!"
              : "disabled!",
        });
        break;

      case "toggle-autoban":
        phishSettings.autobanPhishers = !phishSettings.autobanPhishers;
        await settings.replaceOne({ guild: i.guildId }, phishSettings);
        await i.reply({
          content:
            "Autoban has been " + phishSettings.autobanPhishers
              ? "enabled!"
              : "disabled!",
        });
        break;
    }
  },
};
