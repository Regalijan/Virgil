import { CommandInteraction, GuildMember, MessageEmbed } from 'discord.js'
import mongo from '../mongo'
import { Document } from 'mongodb'

export = {
  name: 'listbinds',
  description: 'Shows all server binds',
  interactionData: {
    name: 'listbinds',
    description: 'Shows all server binds'
  },
  async exec (i: CommandInteraction): Promise<void> {
    const binds: Document[] = []
    mongo.db().collection('binds').find({ server: i.guildId }).forEach(doc => { binds.push(doc) })
    const embed = new MessageEmbed()
    if (i.member instanceof GuildMember) embed.setColor(i.member.displayColor)
    for (const bind of binds) {
      embed.addField(bind.type + bind.asset ?? bind.group, `<@&${bind.role.id}>`)
    }
    await i.reply({ embeds: [embed] })
  }
}
