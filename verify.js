const db = require('./database')
const request = require('axios')
module.exports = {
  async run (message, user) {
    if (!message.guild.me.hasPermission('MANAGE_ROLES')) return message.channel.send('I cannot modify your roles as I do not have the "Manage Roles" permission.')
    if (message.author.bot) return message.channel.send('I cannot verify bots.')
    const linkedRoles = await db.query('SELECT * FROM roblox_roles WHERE guild = $1;', [message.guild.id])
    let member = message.member
    if (message.author.id !== user) member = await message.guild.members.fetch(user)
    let robloxId
    let verificationData = await request(`https://verify.eryn.io/api/user/${user}`, { validateStatus: false })
    if (verificationData.status === 200) robloxId = verificationData.data.robloxId
    else {
      verificationData = await request(`https://api.blox.link/v1/user/${user}`, { validateStatus: false })
      if (verificationData.data && verificationData.data.status === 'ok') robloxId = verificationData.data.primaryAccount
      else return message.channel.send('The registries did not return any data, you are probably not verified. You may verify at either registry: <https://verify.eryn.io> <https://blox.link/verify>')
    }
    if (linkedRoles.rowCount === 0) return message.channel.send('User has been verified')
    if (!robloxId) return message.channel.send('An unexpected error occured when fetching data.')
    const bancheck = await request(`https://users.roblox.com/v1/users/${robloxId}`).catch(() => { return message.channel.send('An error occured when fetching data from Roblox!') })
    if (bancheck.data.isBanned) return
    let groupdata = await request(`https://groups.roblox.com/v2/users/${robloxId}/groups/roles`, { validateStatus: false })
    if (groupdata.status !== 200) return message.channel.send('An error occured when looking up group roles!')
    groupdata = groupdata.data.data
    linkedRoles.rows.forEach(async row => {
      if (row.type !== 'Group') {
        const roledata = await request(`https://inventory.roblox.com/v1/users/${robloxId}/items/${row.type}/${row.link_id}`, { validateStatus: false }).catch((e) => console.error(e))
        if (roledata.status !== 200) return
        if (roledata.data && roledata.data.data[0] && roledata.data.data[0].id === parseInt(row.link_id)) {
          if (message.guild.roles.cache.find(role => role.id === row.role_id)) {
            const role = message.guild.roles.cache.find(role => role.id === row.role_id)
            if (role.position < message.guild.me.roles.highest.position) member.roles.add(row.role_id).catch(e => console.error(e))
          } else {
            return message.channel.send('I could not finish giving the roles! One of the set roles was deleted!')
          }
        }
      } else {
        if (groupdata.length !== 0) {
          for (let i = 0; i < groupdata.length; i++) {
            if (groupdata[i].group.id.toString() === row.link_id) {
              const resolvedrole = await message.guild.roles.fetch(row.role_id)
              if (!row.rank || groupdata[i].role.rank === row.rank) {
                if (message.guild.me.roles.highest.position > resolvedrole.position) {
                  try {
                    member.roles.add(row.role_id)
                  } catch (e) {
                    console.error(e)
                  }
                }
              } else {
                const role = member.roles.cache.find(r => r.id === row.role_id)
                if (role) {
                  try {
                    member.roles.remove(role)
                  } catch (e) {
                    console.error(e)
                  }
                }
              }
            }
          }
        }
      }
    })
    return 1
  },
  async onjoin (member) {
    if (!member.guild.me.hasPermission('MANAGE_ROLES')) return
    if (member.user.bot) return
    const linkedRoles = await db.query('SELECT * FROM roblox_roles WHERE guild = $1;', [member.guild.id])
    if (linkedRoles.rowCount === 0) return
    let robloxId
    let verificationData = await request(`https://verify.eryn.io/api/user/${member.user.id}`, { validateStatus: false })
    if (verificationData.status === 200) robloxId = verificationData.data.robloxId
    else {
      verificationData = await request(`https://api.blox.link/v1/user/${member.user.id}`, { validateStatus: false })
      if (verificationData.data && verificationData.data.status === 'ok') robloxId = verificationData.data.primaryAccount
      else return false
    }
    if (!robloxId) return
    const bancheck = await request(`https://users.roblox.com/v1/users/${robloxId}`).catch(e => { return console.error(e) })
    if (bancheck.data.isBanned) return
    let groupdata = await request(`https://groups.roblox.com/v1/users/${robloxId}/groups/roles`, { validateStatus: false })
    linkedRoles.rows.forEach(async row => {
      if (row.type !== 'Group') {
        const roledata = await request(`https://inventory.roblox.com/v1/users/${robloxId}/items/${row.type}/${row.link_id}`, { validateStatus: false }).catch((e) => { return console.error(e) })
        if (roledata.status !== 200) return
        if (roledata.data && roledata.data.data[0] && roledata.data.data[0].id === parseInt(row.link_id)) {
          if (member.guild.roles.cache.find(role => role.id === row.role_id)) {
            const role = member.guild.roles.cache.find(role => role.id === row.role_id)
            if (role.position < member.guild.me.roles.highest.position) member.roles.add(row.role_id).catch(e => { return console.error(e) })
          } else return false
        }
      } else {
        if (!groupdata.data || groupdata.data.data === []) return true
        groupdata = groupdata.data.data
        for (let i = 0; i < groupdata.length; i++) {
          if (groupdata[i].group.id.toString() === row.link_id) {
            const resolvedrole = await member.guild.roles.fetch(row.role_id)
            if (!row.rank || groupdata[i].role.rank === row.rank) {
              if (member.guild.me.roles.highest.position > resolvedrole.position) {
                try {
                  member.roles.add(row.role_id)
                } catch (e) {
                  console.error(e)
                }
              }
            } else {
              const role = member.roles.cache.find(r => r.id === row.role_id)
              if (role) {
                try {
                  member.roles.remove(role)
                } catch (e) {
                  console.error(e)
                }
              }
            }
          }
        }
      }
    })
    return true
  }
}
