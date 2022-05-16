import {
  CommandInteraction,
  MessageActionRow,
  MessageButton,
} from "discord.js";
import Common from "../common";

export = {
  name: "verify",
  async exec(i: CommandInteraction): Promise<void> {
    const member = await i.guild?.members.fetch(i.user.id);
    if (!member)
      return await i.reply({
        content:
          "An error occurred when attempting to verify you - please try again later.",
        ephemeral: true,
      });
    await i.deferReply();
    const resultString = await Common.verify(member);
    const replyOpts: { content: string; components?: MessageActionRow[] } = {
      content: await Common.verify(member),
    };
    if (resultString === "You must be new, click the button to get started.") {
      const notVerifiedLinkButton = new MessageButton({
        emoji: "🔗",
        label: "Verify your account",
        style: "LINK",
        url: "https://rover.link/my/verification",
      });
      const verifyButton = new MessageButton({
        customId: "verify",
        label: "I have verified my account",
        style: "PRIMARY",
      });
      replyOpts.components = [
        new MessageActionRow().addComponents(
          notVerifiedLinkButton,
          verifyButton
        ),
      ];
    }
    await i.followUp(replyOpts);
  },
};
