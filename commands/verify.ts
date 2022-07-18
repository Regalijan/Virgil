import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CommandInteraction,
} from "discord.js";
import Common from "../common";

export = {
  name: "verify",
  async exec(i: CommandInteraction): Promise<void> {
    const member = await i.guild?.members.fetch(i.user.id);
    if (!member) {
      await i.reply({
        content:
          "An error occurred when attempting to verify you - please try again later.",
        ephemeral: true,
      });
      return;
    }

    await i.deferReply();
    const resultString = await Common.verify(member);
    const replyOpts: {
      content: string;
      components: ActionRowBuilder<ButtonBuilder>[];
    } = {
      content: await Common.verify(member),
      components: [],
    };
    if (resultString === "You must be new, click the button to get started.") {
      const notVerifiedLinkButton = new ButtonBuilder({
        emoji: "🔗",
        label: "Verify your account",
        style: ButtonStyle.Link,
        url: "https://rover.link/verify",
      });
      const verifyButton = new ButtonBuilder({
        customId: "verify_recheck",
        label: "I have verified my account",
        style: ButtonStyle.Primary,
      });
      replyOpts.components = [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          notVerifiedLinkButton,
          verifyButton
        ),
      ];
    }
    await i.followUp(replyOpts);
  },
};
