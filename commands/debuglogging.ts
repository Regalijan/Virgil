import { ChatInputCommandInteraction, MessageFlagsBitField } from "discord.js";

// This command intentionally does not have an included definition
// It should not ever be registered globally
// Register this in a home guild and restrict it to you or trusted people
export = {
  name: "debuglogging",
  async exec(i: ChatInputCommandInteraction): Promise<void> {
    const toggleChoice = i.options.getBoolean("enabled", true);

    if (toggleChoice) {
      // @ts-expect-error
      process.emit("enableDebug");
      await i.reply({
        content: "Debug logging enabled!",
        flags: [MessageFlagsBitField.Flags.Ephemeral],
      });
      return;
    }

    // @ts-expect-error
    process.emit("disableDebug");
    await i.reply({
      content: "Debug logging disabled!",
      flags: [MessageFlagsBitField.Flags.Ephemeral],
    });
  },
};
