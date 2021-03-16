module.exports = {
  name: 'disablerolelog',
  properName: 'DisableRoleLog',
  description: 'Disables role logging',
  guildOnly: true,
  async execute (message, args) {
    if (!message.member.hasPermission('MANAGE_GUILD')) return message.channel.send('You do not have permission to run this command!')
    const db = require('../database')
    const query = await db.query('UPDATE core_settings SET role_log_channel = null WHERE guild_id = $1;', [message.guild.id]).catch(e => console.error(e))
    if (!query) return message.channel.send('An error occured when disabling role logging!')
    await message.channel.send('Role logging disabled!')
  }
}
