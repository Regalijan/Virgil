import { CommandInteraction } from 'discord.js'
import mongo from '../mongo'

export = {
  name: 'ban',
  permissions: ['BAN_MEMBERS'],
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

    await target.ban({ reason: i.options.getString('reason', false) ?? 'No reason provided.' })
  }
}
