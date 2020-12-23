const db = require('../database')
const { prefix } = require('../config.json')
module.exports = {
  name: 'deletegrouprank',
  description: 'Deletes a group rank bind',
  guildOnly: true,
  async execute (message, args) {
    if (!message.member.hasPermission('MANAGE_SERVER')) return message.channel.send('You do not have permission to run this command!')
    if (!args[0]) return message.channel.send(`Usage: \`${prefix}addgrouprank  <RoleID/Name> <GroupID> [rank]\`\nIf the role has spaces you **MUST** use the ID. \`${prefix}roleinfo\``)
    let role
    if (args[0].match(/(<@&[0-9]*>)/)) role = role.replace(/(<@&|>)/g, '')
    if (args[0].match(/^\d+$/)) role = args[0]
    else {
      role = message.guild.roles.cache.find(r => r.name.toLowerCase() === args[0].toLowerCase())
      role = role.id
    }
    await db.query('DELETE FROM roblox_roles WHERE role_id = $1 AND guild = $2;', [role, message.guild.id]).catch(e => {
      console.error(e)
      return message.channel.send('I could not delete the bind!')
    })
    return message.channel.send('Bind deleted.')
  }
}
