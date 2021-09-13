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
    const target = i.options.getUser('person', true)
    const member = await i.guild?.members.fetch(target.id).catch(e => console.error(e))
    if (!member) return await i.reply({ content: 'Oops! I could not find that member in the server.', ephemeral: true })
    const embed = new MessageEmbed({ title: 'Noob Detector', author: { name: member.user.tag, icon_url: member.user.displayAvatarURL({ dynamic: true }) }, color: member.displayColor })
    embed.addField('Noob Level', `${Math.round(Math.random() * 100)} out of 100`)
    await i.reply({ embeds: [embed] })
  }
}
