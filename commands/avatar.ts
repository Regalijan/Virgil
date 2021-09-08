import { CommandInteraction, MessageEmbed } from 'discord.js'

export = {
  name: 'avatar',
  permissions: [],
  interactionData: {
    name: 'avatar',
    description: 'Gets avatar of user',
    options: [
      {
        type: 6,
        name: 'user',
        description: 'User to get avatar of'
      }
    ]
  },
  async exec (i: CommandInteraction): Promise<void> {
    const embed = new MessageEmbed({
      title: 'Avatar'
    })
    if (i.options.getUser('user')) {
      const target = i.options.getUser('user', true)
      embed.setAuthor(target.tag, target.displayAvatarURL({ dynamic: true }))
      embed.setImage(target.displayAvatarURL({ dynamic: true }))
      const targetMember = await i.guild?.members.fetch(target.id)
      if (targetMember?.displayColor) embed.setColor(targetMember.displayColor)
    } else {
      embed.setAuthor(i.user.tag, i.user.displayAvatarURL({ dynamic: true }))
      embed.setImage(i.user.displayAvatarURL({ dynamic: true }))
      const selfMember = await i.guild?.members.fetch(i.user.id)
      if (selfMember?.displayColor) embed.setColor(selfMember.displayColor)
    }
    await i.reply({ embeds: [embed] })
  }
}
