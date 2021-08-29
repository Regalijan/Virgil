import { CommandInteraction, MessageEmbed } from 'discord.js'
import axios from 'axios'

export = {
  name: 'cat',
  permissions: [],
  async exec (i: CommandInteraction): Promise<void> {
    const cat = await axios('https://nekos.life/api/v2/img/meow').catch(e => console.error(e))
    if (!cat) {
      await i.reply({ content: 'The server decided no cat pic for you - please try again later.' })
      return
    }

    const embed = new MessageEmbed()
      .setTitle('Meow :cat:')
      .setColor((await i.guild.members.fetch(i.user.id)).displayColor ?? 3756250)
      .setImage(cat.data.url)
      .setAuthor(i.user.tag, i.user.displayAvatarURL({ dynamic: true }))
    await i.reply({ embeds: [embed] })
  }
}
