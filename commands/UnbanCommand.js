module.exports = {
  name: 'unban',
  description: 'Unbans a user from the server',
  guildOnly: true,
  async execute (message, args) {
    if (!message.member.hasPermission('BAN_MEMBERS')) return await message.channel.send('You cannot run this command!')
    if (!message.guild.me.hasPermission('BAN_MEMBERS')) return await message.channel.send('I cannot run this command as I do not have the Ban Members permission!')
    if (args.length === 0) return await message.channel.send('I cannot unban the void!')
    if (args[0].match(/\D/)) return await message.channel.send('You must use their numerical user id to unban them!')
    const ban = await message.guild.fetchBan(args[0]).catch(() => {})
    if (!ban) return await message.channel.send('I could not find that user!')
    const success = await message.guild.members.unban(ban.user.id).catch(() => {})
    if (!success) return await message.channel.send('An unknown error occured when unbanning that user!')
    await message.channel.send(`${ban.user.tag} unbanned.`)
  }
}
