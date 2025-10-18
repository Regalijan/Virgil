import {
  ActionRowBuilder,
  ActionRowModalData,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { execSync } from "child_process";
import Common from "../common";

export = {
  name: "internetspeed",
  async exec(i: ChatInputCommandInteraction): Promise<void> {
    if (!(await Common.isDeveloper(i.user))) {
      const embed = new EmbedBuilder().setImage(
        "https://thumbsnap.com/sc/3N5uU9CP.png",
      );
      const member = await i.guild?.members
        .fetch(i.user.id)
        .catch((e) => console.error(e));
      if (member) embed.setColor(member.displayColor);
      await i.reply({ embeds: [embed] });
      return;
    }
    let result = "Test failed";
    try {
      await i.showModal({
        components: [
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder({
              customId: "st_server_modal",
              label: "Select a server (leave empty for auto)",
              maxLength: 6,
              required: false,
              style: TextInputStyle.Short,
            }),
          ),
        ],
        customId: "st_server_component",
        title: "Select Speedtest Server",
      });
    } catch {
      await i.reply({ content: "Test failed", ephemeral: true });
    }
    let submission: ModalSubmitInteraction;
    try {
      submission = await i.awaitModalSubmit({
        filter: (sub) => sub.customId === "st_server_component",
        time: 30000,
      });
    } catch {
      await i.reply({ content: "Too slow!", ephemeral: true });
      return;
    }

    const serverId = (submission.components[0] as ActionRowModalData).components[0].value;
    if (serverId && isNaN(parseInt(serverId))) {
      await i.reply({ content: "Invalid server ID", ephemeral: true });
      return;
    }

    let success = true;
    await submission.deferReply();
    try {
      result = JSON.parse(
        execSync(
          `speedtest --accept-license -f json${
            serverId ? ` -s ${serverId}` : ""
          }`,
        ).toString(),
      ).result.url;
    } catch (e) {
      success = false;
      result = `Test failed. Details:\n${e}`;
    }
    await submission.followUp({ content: `${result}${success ? ".png" : ""}` });
  },
};
