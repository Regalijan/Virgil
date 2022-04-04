import { CommandInteraction, MessageEmbed } from "discord.js";
import { execSync } from "child_process";
import axios from "axios";
import Common from "../common";

interface RawEvent {
  op: number;
  d?: any;
  s?: number;
  t?: string;
}

async function callback(
  webhook: string,
  data: string
): Promise<{ success: boolean; details?: string }> {
  const req = await axios(webhook, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    data,
    validateStatus: () => true,
  });
  if (req.status !== 200) return { success: false, details: req.data };
  return { success: true };
}

export = {
  name: "internetspeed",
  permissions: [],
  async exec(i: CommandInteraction): Promise<void> {
    if (!(await Common.isDeveloper(i.user))) {
      const embed = new MessageEmbed().setImage(
        "https://thumbsnap.com/sc/3N5uU9CP.png"
      );
      const member = await i.guild?.members
        .fetch(i.user.id)
        .catch((e) => console.error(e));
      if (member) embed.setColor(member.displayColor);
      return await i.reply({ embeds: [embed] });
    }
    let result = "Test failed";
    const modalReq = await callback(
      `https://discord.com/api/v10/interactions/${i.id}/${i.token}/callback`,
      JSON.stringify({
        type: 9,
        data: {
          title: "Select Speedtest Server",
          custom_id: "st_server_component",
          components: [
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "st_server_modal",
                  style: 1,
                  label: "Select a server (leave empty for auto)",
                  max_length: 6,
                  required: false,
                },
              ],
            },
          ],
        },
      })
    );
    if (!modalReq.success)
      return await i.reply({
        content: `Failed to create modal: ${JSON.stringify(modalReq.details)}`,
        ephemeral: true,
      });
    try {
      // This is a temporary "hack" until discord.js implements proper modal support.
      i.client.on("raw", async function (packet: RawEvent) {
        if (packet.op !== 0 || packet.t !== "INTERACTION_CREATE") return;
        const { d: data } = packet;
        if (data.type !== 5 || data.data.custom_id !== "st_server_component")
          return;
        const serverId = data.data.components[0].components[0].value;
        const deferReq = await callback(
          `https://discord.com/api/v10/interactions/${data.id}/${data.token}/callback`,
          '{"type":5}'
        );
        if (!deferReq.success) {
          i.client.removeListener("raw", () => {});
          return await i.reply({
            content: `Failed to defer modal: ${JSON.stringify(
              deferReq.details
            )}`,
            ephemeral: true,
          });
        }
        let success = true;
        try {
          result = JSON.parse(
            execSync(
              `speedtest --accept-license -f json${
                serverId ? ` -s ${serverId}` : ""
              }`
            ).toString()
          ).result.url;
        } catch (e) {
          success = false;
          result = `Test failed. Details:\n${e}`;
        }
        await callback(
          `https://discord.com/api/v10/webhooks/${i.client.user?.id}/${data.token}`,
          `{"content":"${result}${success ? ".png" : ""}"}`
        );
        i.client.removeListener("raw", () => {});
      });
    } catch {
      return await i.reply({
        content: "An error occurred while running the speed test.",
        ephemeral: true,
      });
    }
  },
};
