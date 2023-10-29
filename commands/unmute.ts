import {
  ChatInputCommandInteraction,
  GuildMember,
  PermissionsBitField,
} from "discord.js";

export = {
  name: "unmute",
  privileged: true,
  async exec(i: ChatInputCommandInteraction): Promise<void> {
    if (!i.guild) {
      await i.reply({
        content: "This command can only be used in a guild.",
        ephemeral: true,
      });
      return;
    }

    if (!i.appPermissions?.has(PermissionsBitField.Flags.ModerateMembers)) {
      await i.reply({
        content:
          'I cannot unmute the user because I do not have the "Timeout members" permission.',
        ephemeral: true,
      });
      return;
    }

    let targetMember = i.options.getMember("user");

    if (!(targetMember instanceof GuildMember))
      targetMember = await i.guild.members.fetch(
        i.options.getUser("user", true).id,
      );
    await targetMember.timeout(
      null,
      `Timeout removed by ${i.user.tag} (${i.user.id})`,
    );
  },
};
