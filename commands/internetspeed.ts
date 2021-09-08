import { CommandInteraction, MessageEmbed } from 'discord.js'

export = {
  name: 'internetspeed',
  permissions: [],
  interactionData: {
    name: 'internetspeed',
    description: 'Show your internet speed'
  },
  async exec (i: CommandInteraction): Promise<void> {
    const embed = new MessageEmbed()
      .setImage('https://thumbsnap.com/sc/3N5uU9CP.png')
    const member = await i.guild?.members.fetch(i.user.id).catch(e => console.error(e))
    if (member) embed.setColor(member.displayColor)
    await i.reply({ embeds: [embed] })
  }
}
