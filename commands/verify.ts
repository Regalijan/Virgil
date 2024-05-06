import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatCommandCommandInteraction,
} from "discord.js";
import Common from "../common";

export = {
  name: "verify",
  async exec(i: ChatCommandCommandInteraction): Promise<void> {
    const member = await i.guild?.members.fetch(i.user.id);
    if (!member) {
      await i.reply({
        content:
          "An error occurred when attempting to verify you - please try again later.",
        ephemeral: true,
      });
      return;
    }

    const results = await Common.verify(member, true, i);
    const replyOpts: {
      content: string;
      components: ActionRowBuilder<ButtonBuilder>[];
    } = {
      content: results.content,
      components: [],
    };
    if (!results.verified) {
      const notVerifiedLinkButton = new ButtonBuilder({
        emoji: "🔗",
        label: "Verify your account",
        style: ButtonStyle.Link,
        url: "https://registry.virgil.gg/me",
      });
      const verifyButton = new ButtonBuilder({
        customId: "verify_recheck",
        label: "I have verified my account",
        style: ButtonStyle.Primary,
      });
      replyOpts.components = [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          notVerifiedLinkButton,
          verifyButton,
        ),
      ];
    }
    i.deferred ? await i.followUp(replyOpts) : await i.reply(replyOpts);
  },
};
