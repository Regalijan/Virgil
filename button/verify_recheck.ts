import {
  ButtonInteraction,
  GuildMember,
  MessageFlagsBitField,
} from "discord.js";
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
        flags: [MessageFlagsBitField.Flags.Ephemeral],
      });
      return;
    }
    const payload = { content: response.content };
    canEdit
      ? await i.message.edit(payload)
      : i.deferred
        ? await i.followUp(
            Object.defineProperty(payload, "flags", [
              MessageFlagsBitField.Flags.Ephemeral,
            ]),
          )
        : await i.reply(
            Object.defineProperty(payload, "flags", [
              MessageFlagsBitField.Flags.Ephemeral,
            ]),
          );
  },
};
