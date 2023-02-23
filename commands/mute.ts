import { ChatInputCommandInteraction, PermissionsBitField } from "discord.js";

export = {
  name: "mute",
  privileged: true,
  async exec(i: ChatInputCommandInteraction): Promise<void> {
    if (!i.appPermissions?.has(PermissionsBitField.Flags.ModerateMembers)) {
      await i.reply({
        content:
          'I cannot mute as I do not have the "Timeout members" permission.',
        ephemeral: true,
      });
      return;
    }

    const targetGuildMember = await i.guild?.members.fetch(
      i.options.getUser("user", true).id
    );
    if (targetGuildMember?.communicationDisabledUntil) {
      await i.reply({
        content: "The user is already muted!",
        ephemeral: true,
      });
      return;
    }

    if (!targetGuildMember) {
      await i.reply({
        content: "That user could not be found!",
        ephemeral: true,
      });
      return;
    }

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
