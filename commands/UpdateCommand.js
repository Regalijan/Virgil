const request = require('axios')

module.exports = {
  name: 'update',
  description: "Updates the target user's role bindings.",
  guildOnly: true,
  async execute (message, args) {
    let robloxId
    let roverData
    let bloxlinkData
    const { badges, gamepasses, groupranks, updateCommandRoles } = require(`../serversettings/${message.guild.id}.json`)
    let member = args[0]
    if (args[0].match(/(^<@!?[0-9]*>)/)) {
      member = message.mentions.members.first().user.id
    }
    if ((message.member.roles.cache.some(role => updateCommandRoles.includes(role.id))) || (message.member.hasPermission('MANAGE_GUILD'))) {
      try {
        roverData = await request(`https://verify.eryn.io/api/user/${member}`)
      } catch (e) {
        console.error(e.stack)
      }
      if (roverData.status === 200) {
        robloxId = roverData.data.robloxId
      } else {
        try {
          bloxlinkData = await request(`https://api.blox.link/v1/user/${member}`)
          if (bloxlinkData.data.status === 'ok') robloxId = bloxlinkData.data.primaryAccount
        } catch (e) {
          console.error(e.stack)
        }
      }
      if (!roverData.data.robloxId && !bloxlinkData.data.primaryAccount) return message.channel.send('This user could not be found!')
      try {
        member = await message.guild.members.fetch(member)
        const groupData = await request(`https://groups.roblox.com/v1/users/${robloxId}/groups/roles`)
        if (groupData.status === 400) return message.channel.send('I could not check group ranks as this user appears to be deleted!')
        else if ((groupData.status !== 200) && (groupData.status !== 400)) return message.channel.send('I could not retrieve group ranks as Roblox is currently having problems!')
        if (groupData.data.data) {
          for (let i = 0; i < groupData.data.data.length; i++) {
            for (let x = 0; x < groupranks.length; x++) {
              if ((groupranks[x].rank.includes(groupData.data.data[i].role.rank)) && (message.member.guild.me.hasPermission('MANAGE_ROLES'))) {
                member.roles.add(groupranks[x].role).catch(e => console.error(e.stack))
              }
            }
          }
        }
        if (badges) {
          for (let i = 0; i < badges.length; i++) {
            const badgeData = await request(`https://inventory.roblox.com/v1/users/${robloxId}/items/Badge/${badges[i].badge}`)
            if ((badgeData.data.data) && (message.member.guild.me.hasPermission('MANAGE_ROLES')) && (member)) {
              member.roles.add(badges[i].role).catch(e => console.error(e.stack))
            }
          }
        }
        if (gamepasses) {
          for (let i = 0; i < gamepasses.length; i++) {
            const gamepassData = await request(`https://inventory.roblox.com/v1/users/${robloxId}/items/GamePass/${gamepasses[i].gamepass}`)
            if (gamepassData.data.data) {
              if ((gamepassData.data.data[0].id === gamepasses[i].gamepass) && (message.member.guild.me.hasPermission('MANAGE_ROLES')) && (member)) {
                member.roles.add(gamepasses[i].role).catch(e => console.error(e => console.error(e.stack)))
              }
            }
          }
        }
      } catch (e) {
        console.error(e.stack)
      }
      return message.channel.send('Finished updating roles!')
    } else {
      return message.channel.send('You do not have permission to run this command!')
    }
  }
}
