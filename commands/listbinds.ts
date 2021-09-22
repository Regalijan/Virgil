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
    const bindDoc = mongo.db('bot').collection('binds').find({ server: i.guildId })
    bindDoc.forEach(doc => { binds.push(doc) })
    console.log(bindDoc)
    const embed = new MessageEmbed()
      .setDescription('\u200B')
    if (i.member instanceof GuildMember) embed.setColor(i.member.displayColor)
    for (const bind of binds) {
      embed.addField(bind.type + bind.asset ?? bind.group, `<@&${bind.role.id}>`)
    }
    await i.reply({ embeds: [embed] })
  }
}
