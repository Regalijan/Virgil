import { CommandInteraction, MessageEmbed } from "discord.js";
import mongo from "../mongo";
const settings = mongo.db("bot").collection("settings");

export = {
  name: "antiphish",
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
          .setAuthor({
            name: i.user.tag,
            iconURL: i.user.displayAvatarURL({ dynamic: true }),
          })
          .setDescription("Anti-phishing settings status")
          .addFields(
            {
              name: "Anti-Phishing Core",
              value: phishSettings?.antiphish ? "Enabled" : "Disabled",
            },
            {
              name: "Autoban",
              value: phishSettings?.autobanPhishers ? "Enabled" : "Disabled",
            },
            {
              name: "Autoban Message",
              value: phishSettings?.antiphishMessage
                ? phishSettings.antiphishMessage.length > 1024
                  ? phishSettings.antiphishMessage.substr(0, 1021) + "..."
                  : phishSettings.antiphishMessage
                : "None set",
            }
          );

        await i.reply({ embeds: [embed] });
        break;

      case "toggle-antiphish":
        phishSettings.antiphish = !phishSettings.antiphish;
        await settings.replaceOne({ guild: i.guildId }, phishSettings);
        await i.reply({
          content: `Anti-phish has been ${
            phishSettings.antiphish ? "enabled" : "disabled"
          }!`,
        });
        break;

      case "toggle-autoban":
        const updateObj = phishSettings.autobanPhishers
          ? { $unset: { autobanPhishers: "" } }
          : { $set: { autobanPhishers: true } };
        await settings.updateOne({ guild: i.guildId }, updateObj);
        await i.reply({
          content: `Autoban has been ${
            phishSettings.autobanPhishers ? "disabled" : "enabled"
          }!`,
        });
        break;

      case "set-message":
        const message = i.options.getString("message", false);
        if (!phishSettings.antiphishMessage && !message)
          return await i.reply({
            content:
              "There is nothing to do here because there is no message set.",
          });
        if (message) {
          await settings.updateOne(
            { guild: i.guildId },
            { $set: { antiphishMessage: message } }
          );
          return await i.reply({ content: "Message set!" });
        }
        await settings.updateOne(
          { guild: i.guildId },
          { $unset: { antiphishMessage: "" } }
        );
        await i.reply({ content: "Message removed!" });
    }
  },
};
