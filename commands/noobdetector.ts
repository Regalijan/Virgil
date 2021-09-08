import { CommandInteraction, MessageEmbed } from 'discord.js'

export = {
  name: 'noobdetector',
  permissions: [],
  interactionData: {
    name: 'noobdetector',
    description: 'Detect noobiness',
    options: [
      {
        type: 6,
        name: 'person',
        description: 'User to check noobiness of',
        required: true
      }
    ]
  },
  async exec (i: CommandInteraction): Promise<void> {
    const embed = new MessageEmbed({ title: 'Noob Detector', author: { name: i.user.tag, icon_url: i.user.displayAvatarURL({ dynamic: true }) } })
    const target = i.options.getUser('person', true)
    const member = await i.guild?.members.fetch(target.id).catch(e => console.error(e))
    if (member) embed.setColor(member.displayColor)
    embed.addField('Noob Level', `${Math.round(Math.random() * 100)}`)
    await i.reply({ embeds: [embed] })
  }
}
