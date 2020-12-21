const db = require('./database')
const request = require('axios')
module.exports = {
  async run (message, user) {
    const linkedRoles = await db.query('SELECT * FROM roblox_roles WHERE guild = $1;', [message.guild.id])
    let robloxId
    let verificationData = await request(`https://verify.eryn.io/api/user/${user}`, { validateStatus: false })
    if (verificationData.status === 200) robloxId = verificationData.data.robloxId
    else {
      verificationData = await request(`https://api.blox.link/v1/user/${user}`, { validateStatus: false })
      if (verificationData.data.status === 'ok') robloxId = verificationData.data.primaryAccount
      else return message.channel.send('I could not find this user!')
    }
    if (linkedRoles.rowCount === 0) return message.channel.send('User has been verified')
    const member = await message.guild.members.fetch(user)
    let groupdata = await request(`https://groups.roblox.com/v1/users/${robloxId}/groups/roles`, { validateStatus: false })
    linkedRoles.rows.forEach(async row => {
      if (row.type !== 'Group') {
        const roledata = await request(`https://inventory.roblox.com/v1/users/${robloxId}/items/${row.type}/${row.item_id}`).catch((e) => {
          console.error(e)
          return message.channel.send('I could not look up roles! Roblox appears to be having issues.')
        })
        if (roledata.data && roledata.data !== []) {
          if (message.guild.roles.cache.find(role => role.id === row.role_id)) {
            const role = message.guild.roles.cache.find(role => role.id === row.role_id)
            if (role.position > message.guild.me.roles.highest.position) member.roles.add(row.role_id).catch(e => console.error(e))
          } else {
            return message.channel.send('I could not finish giving the roles! One of the set roles was deleted!')
          }
        }
      } else {
        if (!groupdata.data || groupdata.data.data === []) return
        groupdata = groupdata.data.data
        linkedRoles.rows.forEach(async role => {
          for (let i = 0; i < groupdata.length; i++) {
            if (role.rank === groupdata[i].role.rank) {
              const boundrole = message.guild.roles.cache.find(item => role.role_id === item.id)
              if (boundrole) {
                if (boundrole.position > message.guild.me.roles.highest.position) member.roles.add(role.role_id).catch(e => console.error(e))
              }
            }
          }
        })
      }
    })
    return message.channel.send('Verification finished!')
  }
}
