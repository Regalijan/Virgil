import { CommandInteraction } from 'discord.js'
import mongo from '../mongo'

export = {
  name: 'ban',
  permissions: ['BAN_MEMBERS'],
  privileged: true,
  async exec (i: CommandInteraction): Promise<void> {
    if (!i.guild.me.permissions.has('BAN_MEMBERS')) {
      await i.reply({ content: 'I was unable to ban this user because I do not have the Ban Members permission.', ephemeral: true })
      return
    }

    const target = await i.guild.members.fetch(i.options.getUser('user'))
    if (!target.bannable) {
      await i.reply('This user cannot be banned.')
      return
    }

    let aheadToUnban = 0
    const minutes = i.options.getInteger('minutes', false)
    if (minutes) aheadToUnban += minutes * 60000
    const hours = i.options.getInteger('hours', false)
    if (hours) aheadToUnban += hours * 60 * 60000
    const days = i.options.getInteger('days', false)
    if (days) aheadToUnban += days * 1440 * 60000

    await target.ban({ reason: i.options.getString('reason', false) ?? 'No reason provided.' })
    if (!aheadToUnban) return
    aheadToUnban += Date.now()
    await mongo.db().collection('bans').insertOne({ user: target.id, unban: aheadToUnban })
  }
}
