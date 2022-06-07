import { CommandInteraction, GuildMember } from "discord.js";

export = {
  name: "unmute",
  privileged: true,
  async exec(i: CommandInteraction): Promise<void> {
    if (!i.guild)
      return await i.reply({
        content: "This command can only be used in a guild.",
        ephemeral: true,
      });
    if (!i.guild.me?.permissions.has("MODERATE_MEMBERS"))
      return await i.reply({
        content:
          'I cannot unmute the user because I do not have the "Timeout members" permission.',
        ephemeral: true,
      });
    let targetMember = i.options.getMember("user", true);

    if (!(targetMember instanceof GuildMember))
      targetMember = await i.guild.members.fetch(
        i.options.getUser("user", true).id
      );
    await targetMember.timeout(
      null,
      `Timeout removed by ${i.user.tag} (${i.user.id})`
    );
  },
};
