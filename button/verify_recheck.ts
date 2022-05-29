import { ButtonInteraction, GuildMember, Message } from "discord.js";
import Common from "../common";

export = {
  name: "verify_recheck",
  async exec(i: ButtonInteraction): Promise<void> {
    if (!i.guild || !(i.member instanceof GuildMember)) return;
    await i.deferReply();
    await i.member.fetch();
    let response = await Common.verify(i.member);
    if (response === "You must be new, click the button to get started.") {
      await i.followUp({
        content:
          "You are not verified, please run the `/verify` command again to get started.",
        ephemeral: true,
      });
      return;
    }
    const payload = { content: response, ephemeral: true };
    i.message instanceof Message && i.message.editable
      ? await i.message.edit(payload)
      : await i.followUp(payload);
  },
};
