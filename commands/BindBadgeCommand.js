module.exports = {
  name: 'bindbadge',
  properName: 'BindBadge',
  description: 'Binds a badge to a discord role',
  guildOnly: true,
  async execute (message, args) {
    if (!message.member.hasPermission('MANAGE_SERVER')) return message.channel.send('You do not have permission to run this command!')
    const { prefix } = require('../config.json')
    if (!args[0]) return message.channel.send(`Usage: \`${prefix} <Role> <BadgeID>\`\nIf a role has spaces you **MUST** use the id or it **WILL** not work.`)
    if (!args[1]) return message.channel.send('You did not provide a badge id!')
    const db = require('../database')
    const request = require('axios')
    try {
      await request(`https://badges.roblox.com/v1/badges/${args[1]}`)
    } catch {
      return message.channel.send('Provided badge is invalid!')
    }
    let role
    if (args[0].match(/(<@&[0-9]*>)/)) role = role.replace(/(<@&|>)/g, '')
    if (args[0].match(/^\d+$/)) {
      role = message.guild.roles.cache.find(r => r.id === args[0])
      role = role.id
    } else {
      role = message.guild.roles.cache.find(r => r.name.toLowerCase() === args[0].toLowerCase())
      role = role.id
    }
    if (!role) return message.channel.send('I could not find that role')
    try {
      await db.query('INSERT INTO roblox_roles(role_id,type,link_id,guild) VALUES($1,$2,$3,$4);', [role, 'Badge', args[1], message.guild.id])
    } catch (e) {
      console.error(e)
      return message.channel.send('An error occured when binding the badge!')
    }
    message.channel.send(`Badge ${args[1]} bound to role id ${role}`)
  }
}
