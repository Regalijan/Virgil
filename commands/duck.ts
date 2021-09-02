import { CommandInteraction, MessageEmbed } from 'discord.js'
import axios from 'axios'

export = {
  name: 'duck',
  permissions: [],
  async exec (i: CommandInteraction): Promise<void> {
    const embed = new MessageEmbed({
      title: ':duck: QUACK!',
      color: (await i.guild.members.fetch(i.user.id)).displayColor ?? 3756250
    })
    const ducky = await axios('https://random-d.uk/api/v2/random')
    embed.setImage(ducky.data.url)
    embed.setFooter(ducky.data.message)
    await i.reply({ embeds: [embed] })
  }
}