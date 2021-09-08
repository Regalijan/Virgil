import { CommandInteraction, MessageEmbed } from 'discord.js'
import axios from 'axios'

export = {
  name: 'birb',
  permissions: [],
  interactionData: {
    name: 'birb',
    description: 'Gets picture of birb'
  },
  async exec (i: CommandInteraction): Promise<void> {
    const imglist = await axios('https://random.birb.pw/img/')
    const images = imglist.data.match(/\/img\/\S[^.<]*\.[A-z]*/g)
    const index = Math.round(Math.random() * (images.length - 1))
    const embed = new MessageEmbed({ title: 'Tweet Tweet...' })
    const member = await i.guild?.members.fetch(i.user.id).catch(e => console.error(e))
    if (member?.displayColor) embed.setColor(member.displayColor)
    embed.setImage(`https://random.birb.pw${images[index]}`)
    await i.reply({ embeds: [embed] })
  }
}
