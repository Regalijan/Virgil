import { CommandInteraction } from 'discord.js'
import mongo from '../mongo'

const db = mongo.db('bot')

export = {
  name: 'mute',
  permissions: ['MANAGE_MESSAGES'],
  privileged: true,
  interactionData: {
    name: 'mute',
    description: 'Mute a user to prevent them from chatting',
    options: [
      {
        type: 6,
        name: 'user',
        description: 'User to mute',
        required: true
      },
      {
        type: 4,
        name: 'hours',
        description: 'How many hours to mute for'
      },
      {
        type: 4,
        name: 'minutes',
        description: 'How many minutes to mute for'
      }
    ]
  },
  async exec (i: CommandInteraction): Promise<void> {
    if (!i.guild) throw TypeError('<CommandInteraction>.guild is null')
    if (!i.guild.me?.permissions.has('MANAGE_ROLES')) return await i.reply({ content: 'I cannot mute as I do not have the "Manage Roles" permission.', ephemeral: true })
    const settings = await db.collection('settings').findOne({ guild: i.guild?.id })
    if (!settings?.muteRole) return
    const targetUser = i.options.getUser('user', true)
    const targetGuildMember = await i.guild.members.fetch(targetUser.id)
    if (!targetGuildMember.roles.cache.has(settings.muteRole)) return await i.reply({ content: 'The user already has the mute role.', ephemeral: true })
    await db.collection('mutes').insertOne({ guild: i.guild.id, member: targetGuildMember.id, expires: Date.now() + (i.options.getInteger('hours') ?? 0 * 360000) + (i.options.getInteger('minutes') ?? 0 * 60000) })
    await i.reply({ content: targetUser.username + ' has been muted.' })
  }
}
