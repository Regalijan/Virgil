module.exports = {
  name: 'roblox',
  description: "Looks up a user's roblox information",
  guildOnly: true,
  async execute (message, args) {
    const app = require('../index')
    let user = message.author.id
    let robloxId = 'Unknown'
    const { getuser } = require('../getuser')
    if (args.length > 0) {
      user = await getuser(args.slice(0).join(' '), message)
      user = user.id
    }
    if (!user) return await message.channel.send('I could not find that member!')
    const request = require('axios')
    const roverData = await request(`https://verify.eryn.io/api/user/${user}`, { validateStatus: false }).catch(e => {
      console.log('Failed to fetch data from RoVer!')
      console.error(e.stack)
    })
    const bloxlinkData = await request(`https://api.blox.link/v1/user/${user}`, { validateStatus: false }).catch(e => {
      console.log('Failed to fetch data from BloxLink!')
      console.error(e)
      return message.channel.send('I could not retreive this user\'s data!')
    })
    if (!roverData.data.robloxId && !bloxlinkData.data.primaryAccount) return message.channel.send('This user could not be found!')
    if (roverData.data.robloxId && !bloxlinkData.data.primaryAccount) robloxId = roverData.data.robloxId
    if (!roverData.data.robloxId && bloxlinkData.data.primaryAccount) robloxId = bloxlinkData.data.primaryAccount
    if ((roverData.data.robloxId && bloxlinkData.data.primaryAccount) && roverData.data.robloxId !== parseInt(bloxlinkData.data.primaryAccount)) {
      const rbxinfo = await request(`https://users.roblox.com/v1/users/${bloxlinkData.data.primaryAccount}`)
      await message.channel.send(`I found multiple accounts for this user!\nFrom RoVer: ${roverData.data.robloxUsername}\nFrom BloxLink: ${rbxinfo.data.name}\nSay \`bloxlink\` or \`rover\` to select an account.`)
      const filter = async m => m.author.id === message.author.id
      const received = message.channel.awaitMessages(await filter, { max: 1, time: 20000, errors: ['time'] }).catch(async () => {
        return await message.channel.send('No response, not continuing.')
      })
      if (!received || received.size === 0) return
      const choice = received.first()
      if (choice.toLowerCase() === 'rover') robloxId = roverData.data.robloxId
      else if (choice.toLowerCase() === 'bloxlink') robloxId = bloxlinkData.data.primaryAccount
      else await message.channel.send('Invalid selection!')
    }
    if (!robloxId) return
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
    const { MessageEmbed } = require('discord.js')
    const embed = new MessageEmbed()
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
    if ((await app).owner.id === user) embed.addField('User Tags', 'Bot Creator', true)
    return message.channel.send(embed)
  }
}
