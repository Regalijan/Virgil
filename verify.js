module.exports = {
  async run (message, user) {
    if (!message.guild.me.hasPermission('MANAGE_ROLES')) return message.channel.send('I cannot modify your roles as I do not have the "Manage Roles" permission.')
    if (message.author.bot) return message.channel.send('I cannot verify bots.')
    const db = require('./database')
    const linkedRoles = await db.query('SELECT * FROM roblox_roles WHERE guild = $1;', [message.guild.id])
    let member = message.member
    if (message.author.id !== user) member = await message.guild.members.fetch(user)
    const request = require('axios')
    const verificationData = await request(`https://verify.eryn.io/api/user/${user}`, { validateStatus: false })
    if (verificationData.status !== 200) {
      const unvRoleSetting = await db.query('SELECT unverified_role FROM core_settings WHERE guild_id = $1;', [message.guild.id]).rows[0].unverified_role.toString()
      if (unvRoleSetting && message.guild.me.hasPermission('MANAGE_ROLES') && message.guild.roles.cache.find(r => r.id === unvRoleSetting)) {
        const unvRoleServer = message.guild.roles.cache.find(r => r.id === unvRoleSetting)
        if (unvRoleServer && unvRoleServer.rawPosition < message.guild.me.roles.highest.rawPosition) {
          try {
            member.roles.add(unvRoleServer)
          } catch (e) {
            console.error(e)
            message.channel.send(`An error occured when adding the role ${unvRoleServer.name}: \`${e}\``)
          }
        }
      }
      return await message.channel.send('You are not verified, you may verify at <https://verify.eryn.io>')
    }
    const robloxId = verificationData.data.robloxId
    if (message.guild.me.hasPermission('MANAGE_NICKNAMES') && member.manageable) {
      const shouldName = await db.query('SELECT * FROM core_settings WHERE guild_id = $1;', [message.guild.id]).rows[0].use_roblox_names
      if (shouldName) await member.setNickname(verificationData.data.robloxUsername).catch((e) => console.error(e))
    }
    if (linkedRoles.rowCount === 0) return message.channel.send('User has been verified')
    if (!robloxId) return message.channel.send('An unexpected error occured when fetching data.')
    const bancheck = await request(`https://users.roblox.com/v1/users/${robloxId}`).catch(() => { message.channel.send('An error occured when fetching data from Roblox!') })
    if (!bancheck) return message.channel.send(`An error occured when fetching information from Roblox! \`(HTTP ${bancheck.status})\``)
    if (bancheck.data.isBanned) return
    let groupdata = await request(`https://groups.roblox.com/v2/users/${robloxId}/groups/roles`, { validateStatus: false })
    if (groupdata.status !== 200) return message.channel.send('An error occured when looking up group roles!')
    groupdata = groupdata.data.data
    linkedRoles.rows.forEach(async row => {
      if (row.type !== 'Group') {
        const roledata = await request(`https://inventory.roblox.com/v1/users/${robloxId}/items/${row.type}/${row.link_id}`, { validateStatus: false }).catch((e) => console.error(e))
        if (roledata.status !== 200) {
          const app = require('./index')
          await message.channel.send(`Uh oh! Roblox errored out on me. Rerun this command in a few seconds, and if it doesn't work, DM ${await app.owner}.`)
          return
        }
        if (roledata.data && roledata.data.data[0] && roledata.data.data[0].id === parseInt(row.link_id)) {
          if (message.guild.roles.cache.find(role => role.id === row.role_id)) {
            const role = message.guild.roles.cache.find(role => role.id === row.role_id)
            if (role.position < message.guild.me.roles.highest.position) member.roles.add(row.role_id).catch(e => console.error(e))
          } else {
            return message.channel.send('I could not finish giving the roles! One of the set roles was deleted!')
          }
        }
      } else {
        if (groupdata.length > 0) {
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
    const db = require('./database')
    const linkedRoles = await db.query('SELECT * FROM roblox_roles WHERE guild = $1;', [member.guild.id])
    if (linkedRoles.rowCount === 0) return
    const request = require('axios')
    const verificationData = await request(`https://verify.eryn.io/api/user/${member.user.id}`, { validateStatus: false })
    if (verificationData.status !== 200) {
      const unvRoleSetting = await db.query('SELECT * FROM core_settings WHERE guild_id = $1;', [member.guild.id]).rows[0].unverified_role.toString()
      if (member.guild.roles.cache.find(r => r.id === unvRoleSetting) && member.guild.me.hasPermission('MANAGE_ROLES')) {
        const unvRoleServer = member.guild.roles.cache.find(r => r.id === unvRoleSetting)
        if (!unvRoleServer || unvRoleServer.rawPosition > member.guild.me.roles.highest.rawPosition) return
        try {
          member.roles.add(unvRoleServer)
        } catch (e) {
          console.error(e)
        }
      }
      return
    }
    const robloxId = verificationData.data.robloxId
    if (member.guild.me.hasPermission('MANAGE_NICKNAMES') && member.manageable) {
      const shouldName = await db.query('SELECT * FROM core_settings WHERE guild_id = $1;', [member.guild.id]).rows[0].use_roblox_names
      if (shouldName) await member.setNickname(verificationData.data.robloxUsername).catch((e) => console.error(e))
    }
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
