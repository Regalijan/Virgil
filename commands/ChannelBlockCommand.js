module.exports = {
  name: 'channelblock',
  properName: 'ChannelBlock',
  description: 'Prevents a user from talking in a specific channel',
  guildOnly: true,
  async execute (message, args) {
    const { MessageEmbed } = require('discord.js')
    const { prefix } = require('../config.json')
    const { getuser } = require('../getuser')
    const overrides = []
    if (args.length < 2) return message.channel.send(`Usage: \`${prefix}channelblock <#channel> <@user>\``)
    if (!message.guild.me.hasPermission('MANAGE_CHANNELS')) return message.channel.send('I cannot modify channel settings as I do not have the manage channels permission.')
    const db = require('../database')
    const overrideData = await db.query('SELECT * FROM overrides WHERE guild = $1;', [message.guild.id])
    overrideData.rows.forEach(row => { if (row.type === 'mod') overrides.push(row.role) })
    if (overrides.length === 0 && !message.member.hasPermission('MANAGE_CHANNELS')) return message.channel.send('You cannot use this command!')
    let channel = args[0]
    channel = channel.replace(/(<#|>)/g, '')
    channel = await message.guild.channels.cache.find(c => c.id === channel)
    if (!channel) return message.channel.send('I could not find that channel!')
    let user = args.slice(1).join(' ')
    user = await getuser(user, message)
    if (!user) return message.channel.send('I could not find that user!')
    await channel.createOverwrite(user, { SEND_MESSAGES: false }).catch(e => {
      console.error(e)
      return message.channel.send(e)
    })
    const embed = new MessageEmbed()
      .setAuthor(message.author.tag, message.author.displayAvatarURL())
      .setColor(3756250)
      .setDescription(`${user} blocked from sending messages in ${channel}!`)
    message.channel.send(embed)
  }
}
