module.exports = {
  name: 'ignorelogs',
  properName: 'IgnoreLogs',
  description: 'Ignores a channel (logging)',
  guildOnly: true,
  async execute (message, args) {
    if (!message.member.hasPermission('MANAGE_GUILD')) return await message.channel.send('You cannot run this command!')
    if (args.length === 0) {
      const { prefix } = require('../config.json')
      return await message.channel.send(`Usage: \`${prefix}ignorelogs <channel/categoryID>\`\nCategories must be supplied as an ID!`)
    }
    const channel = message.guild.channels.cache.find(c => c.id === args[0].replace(/<#|>/g, ''))
    if (!channel) return await message.channel.send('I could not find that channel or category!')
    const db = require('../database')
    await db.query('INSERT INTO ignored(snowflake,type,guild) VALUES($1,$2,$3);', [channel.id, channel.type, message.guild.id]).catch(async () => await message.channel.send('An error occured when ignoring!'))
    await message.channel.send(`${channel} ignored from logs!`)
  }
}
