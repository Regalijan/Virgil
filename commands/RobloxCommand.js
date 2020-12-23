const request = require('axios')
const Discord = require('discord.js')
const config = require('../config.json')

module.exports = {
  name: 'roblox',
  description: "Looks up a user's roblox information",
  guildOnly: true,
  async execute (message, args) {
    let user = message.author.id
    let robloxId = 'Unknown'
    if (args[0]) user = args[0]
    if (user.match(/(^<@!?[0-9]*>)/)) {
      user = message.mentions.members.first().id
    }
    const roverData = await request(`https://verify.eryn.io/api/user/${user}`, { validateStatus: false }).catch(e => {
      console.log('Failed to fetch data from RoVer!')
      console.error(e.stack)
    })
    let bloxlinkData
    if (roverData.status === 200) {
      robloxId = roverData.data.robloxId
    } else {
      bloxlinkData = await request(`https://api.blox.link/v1/user/${user}`, { validateStatus: false }).catch(e => {
        console.log('Failed to fetch data from BloxLink!')
        console.error(e)
        return message.channel.send('I could not retreive this user\'s data!')
      })
      if (bloxlinkData.data.status === 'ok') robloxId = bloxlinkData.data.primaryAccount
    }
    if (!roverData.data.robloxId && !bloxlinkData.data.primaryAccount) return message.channel.send('This user could not be found!')
    const robloxData = await request(`https://users.roblox.com/v1/users/${robloxId}`).catch(e => {
      console.error(e)
      return message.channel.send('Hmm........ something broke. Roblox might be giving me garbage instead of data.')
    })
    let bio = robloxData.data.description
    const joinDate = new Date(robloxData.data.created)
    if (robloxData.data.isBanned) return message.channel.send('This account has been terminated by Roblox!')
    let avatar = await request(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${robloxId}&size=180x180&format=png`).catch(() => { return message.channel.send('I could not fetch this user\'s avatar!') })
    avatar = avatar.data.data[0].imageUrl
    while ((bio.match(/\n/mg) || []).length > 15 || bio.match(/\n\n\n/mg)) {
      const lastN = bio.lastIndexOf('\n')
      bio = bio.slice(0, lastN) + bio.slice(lastN + 1)
    }
    if (bio.length > 500) {
      bio = bio.substr(0, 500) + '...'
    }
    let pastNames = '_'
    let pastNamesData = await request(`https://users.roblox.com/v1/users/${robloxId}/username-history?limit=50&sortOrder=Desc`).catch(e => {
      console.error(e)
    })
    pastNamesData = pastNamesData.data.data
    for (let i = 0; i < pastNamesData.length; i++) {
      pastNames = `${pastNames}, ${pastNamesData[i].name}`
    }
    if (pastNamesData.length === 0) pastNames = 'None'
    if (pastNames !== 'None') pastNames = pastNames.replace('_, ', '')
    const profile = `https://www.roblox.com/users/${robloxData.data.id}/profile`
    const embed = new Discord.MessageEmbed()
      .setTitle('View Profile')
      .setURL(profile)
      .setAuthor(robloxData.data.name, avatar, profile)
      .setColor(3756250)
      .setThumbnail(avatar)
      .setDescription(bio)
      .addFields(
        { name: 'Join Date', value: `${joinDate.getMonth() + 1}/${joinDate.getDate()}/${joinDate.getFullYear()}`, inline: true },
        { name: 'Past Usernames', value: pastNames, inline: true }
      )
    if (config.owner === user) embed.addField('User Tags', 'Bot Creator', true)
    return message.channel.send(embed)
  }
}
