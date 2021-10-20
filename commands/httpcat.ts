import { CommandInteraction, MessageEmbed } from "discord.js";

export = {
  name: "httpcat",
  permissions: [],
  interactionData: {
    name: "httpcat",
    description: "Get an http cat",
    options: [
      {
        type: 4,
        name: "status",
        description: "HTTP status",
        required: true,
      },
    ],
  },
  async exec(i: CommandInteraction): Promise<void> {
    const embed = new MessageEmbed()
      .setTitle(":cat: Meow!")
      .setImage(`https://http.cat/${i.options.getInteger("status")}`);

    const member = await i.guild?.members
      .fetch(i.user.id)
      .catch((e) => console.error(e));
    if (member && member.displayColor) embed.setColor(member.displayColor);
    await i.reply({ embeds: [embed] });
  },
};
