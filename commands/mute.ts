import { CommandInteraction } from "discord.js";

export = {
  name: "mute",
  privileged: true,
  async exec(i: CommandInteraction): Promise<void> {
    if (!i.guild?.me?.permissions.has("MODERATE_MEMBERS"))
      return await i.reply({
        content:
          'I cannot mute as I do not have the "Timeout members" permission.',
        ephemeral: true,
      });
    const targetGuildMember = await i.guild.members.fetch(
      i.options.getUser("user", true).id
    );
    if (targetGuildMember.communicationDisabledUntil)
      return await i.reply({
        content: "The user is already muted!",
        ephemeral: true,
      });
    const minutes = i.options.getNumber("minutes", true);
    const hours = i.options.getNumber("hours", true);
    const timeoutLength = minutes * 60 * 1000 + hours * 60 * 60 * 1000;
    const reason = i.options.getString("reason", false);
    await targetGuildMember.timeout(
      timeoutLength,
      reason || "No reason given."
    );
    await i.reply({
      content: targetGuildMember.user.username + " has been muted.",
    });
  },
};
