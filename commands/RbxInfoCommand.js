const request = require('axios')
const Discord = require('discord.js')
const config = require('../config.json')

module.exports = {
  name: 'rbxinfo',
  description: "Looks up a user's roblox information",
  guildOnly: true,
  async execute (message, args) {
    let user = message.author.id
    let robloxId = 'Unknown'
    let bloxlinkData
    let joinDate = 'Unknown'
    let pastNames = 'None'
    let bio = 'Unknown'
    let avatar = 'Unknown'
    const embed = new Discord.MessageEmbed()
    if (args[0]) user = args[0]
    else if (user.match(/(^<@!?[0-9]*>)/)) {
      user = message.mentions.members.first().id
    }
    const roverData = await request(`https://verify.eryn.io/api/user/${user}`, { validateStatus: false }).catch(e => {
      console.log('Failed to fetch data from RoVer!')
      console.error(e.stack)
    })
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
    if (robloxData.data.isBanned) return message.channel.send('Looks like Roblox deleted this account.')
    avatar = `https://assetgame.roblox.com/Thumbs/Avatar.ashx?username=${robloxData.data.name}`
    const profile = `https://www.roblox.com/users/${robloxData.data.id}/profile`
    const profileSource = await request(profile).catch(e => console.error(e))
    joinDate = profileSource.data.match(/Join Date<p class=text-lead>(.*?)<li/)[1]
    bio = profileSource.data.match(/<meta name=description content=".*? is one of the millions playing, creating and exploring the endless possibilities of Roblox. Join .*? on Roblox and explore together! ?((?:.|\n)*?)"/m)[1]
    if (profileSource.data.match(/<span class=tooltip-pastnames data-toggle=tooltip title="?(.*?)"?>/)) {
      pastNames = profileSource.data.match(/<span class=tooltip-pastnames data-toggle=tooltip title="?(.*?)"?>/)[1].substr(0, 1024)
    }
    while ((bio.match(/\n/mg) || []).length > 3) {
      const lastN = bio.lastIndexOf('\n')
      bio = bio.slice(0, lastN) + bio.slice(lastN + 1)
    }
    if (bio.length > 500) {
      bio = bio.substr(0, 500) + '...'
    }
    bio = bio.replace('@', '@ ')
    embed.setTitle('View Profile')
      .setURL(profile)
      .setAuthor(robloxData.data.name, avatar, profile)
      .setColor(3756250)
      .setThumbnail(avatar)
      .setDescription(bio)
      .addFields(
        { name: 'Join Date', value: joinDate, inline: true },
        { name: 'Past Usernames', value: pastNames, inline: true }
      )
    if (config.owner === user) embed.addField('User Tags', 'Bot Creator', true)
    return message.channel.send(embed)
  }
}
