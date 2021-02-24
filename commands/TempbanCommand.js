module.exports = {
  name: 'tempban',
  description: 'Temporarily bans a member',
  guildOnly: true,
  async execute (message, args) {
    if (!message.member.hasPermission('BAN_MEMBERS')) return
    if (message.guild.me.hasPermission('BAN_MEMBERS')) return await message.channel.send('I cannot ban this member as I do not have the Ban Members permission!')
  }
}
