import { ButtonInteraction, GuildMember } from "discord.js";
import Common from "../common";

export = {
  name: "verify_recheck",
  async exec(i: ButtonInteraction): Promise<void> {
    if (!i.guild || !(i.member instanceof GuildMember)) return;
    const canEdit =
      i.message.editable && i.user.id === i.message.interaction?.id;
    await i.member.fetch();
    let response = await Common.verify(i.member, true, i);
    if (!response.verified) {
      await i.reply({
        content:
          "You are not verified, please run the `/verify` command again to get started.",
        ephemeral: true,
      });
      return;
    }
    const payload = { content: response.content, ephemeral: true };
    canEdit
      ? await i.message.edit(payload)
      : i.deferred
        ? await i.followUp(payload)
        : await i.reply(payload);
  },
};
