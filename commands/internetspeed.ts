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
    try {
      await axios(
        `https://discord.com/api/v10/interactions/${i.id}/${i.token}/callback`,
        {
          headers: {
            "content-type": "application/json",
          },
          method: "POST",
          data: JSON.stringify({
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
                      required: true,
                    },
                  ],
                },
              ],
            },
          }),
        }
      );
      // This is a temporary "hack" until discord.js implements proper modal support.
      i.client.on("raw", async function (packet: RawEvent) {
        if (packet.op !== 0 || packet.t !== "INTERACTION_CREATE") return;
        const { d: data } = packet;
        if (data.type !== 5 || data.data.custom_id !== "st_server_component")
          return;
        const serverId = data.data.components[0].components[0].value;
        await axios(
          `https://discord.com/api/v10/interactions/${data.id}/${data.token}/callback`,
          {
            headers: {
              "content-type": "application/json",
            },
            method: "POST",
            data: '{"type":5}',
          }
        );
        let result: any;
        try {
          result = JSON.parse(
            execSync(
              `speedtest --accept-license -f json${
                serverId ? ` -s ${serverId}` : ""
              }`
            ).toString()
          ).result;
        } catch {
          result = "Test failed";
        }
        await axios(
          `https://discord.com/api/v10/webhooks/${i.client.user?.id}/${data.token}`,
          {
            headers: {
              "content-type": "application/json",
            },
            method: "POST",
            data: `{"content":"${result.url}.png"}`,
          }
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
