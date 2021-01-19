module.exports = {
  name: 'addgrouprank',
  description: 'Bind a group role to a discord role',
  guildOnly: true,
  async execute (message, args) {
    if (!message.member.hasPermission('MANAGE_SERVER')) return message.channel.send('You do not have permission to run this command!')
    const { prefix } = require('../config.json')
    const db = require('../database')
    if (!args[0]) return message.channel.send(`Usage: \`${prefix}addgrouprank  <RoleID/Name> <GroupID> [rank]\`\nIf the role has spaces you **MUST** use the ID. \`${prefix}roleinfo\``)
    if (!args[1]) return message.channel.send('You did not provide a group.')
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
    if (args[2] && (parseInt(args[2]) > 255 || parseInt(args[2]) < 1)) return message.channel.send('Invalid group rank, rank must be between 1 and 255!')
    try {
      if (args[2]) await db.query('INSERT INTO roblox_roles(guild,role_id,link_id,type,rank) VALUES($1,$2,$3,$4,$5);', [message.guild.id, role, args[1], 'Group', args[2]])
      else await db.query('INSERT INTO roblox_roles(guild,role_id,link_id,type) VALUES($1,$2,$3,$4);', [message.guild.id, role, args[1], 'Group'])
      let text = `Role ${role} linked to group ${args[1]}`
      if (args[2]) text += ` rank ${args[2]}`
      return message.channel.send(text)
    } catch (e) {
      console.error(e)
      return message.channel.send('An error occured when binding the role!')
    }
  }
}
