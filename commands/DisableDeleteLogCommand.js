module.exports = {
  name: 'disabledeletelog',
  properName: 'DisableDeleteLog',
  description: 'Disables delete logging',
  guildOnly: true,
  async execute (message, args) {
    if (!message.member.hasPermission('MANAGE_GUILD')) return message.channel.send('You do not have permission to run this command!')
    const db = require('../database')
    await db.query('UPDATE core_settings SET delete_log_channel = null WHERE guild_id = $1;', [message.guild.id]).catch(e => {
      console.error(e)
      return message.channel.send('An error occured when disabling delete logs!')
    })
    message.channel.send('Delete logging disabled!')
  }
}
