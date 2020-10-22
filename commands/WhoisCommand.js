const request = require('axios')
const Discord = require('discord.js')

module.exports = {
    name: "whois",
    description: "Looks up a user's roblox information",
    guildOnly: true,
    async execute(message, args) {
        let user = args[0]
        let robloxId = 'Unknown'
        let robloxUsername = 'Unknown'
        let roverData = undefined
        let bloxlinkData = undefined
        let robloxData = ''
        let profile = ''
        let joinDate = 'Unknown'
        let bio = 'Unknown'
        let pastNames = 'Unknown'
        let avatar = undefined
        const embed = new Discord.MessageEmbed()
        if (user.match(/(^<@!?[0-9]*>)/)) {
            user = message.mentions.members.first().id
        }
        try {
            roverData = await request(`https://verify.eryn.io/api/user/${member}`)
        }
        catch (e) {
            console.error(e.stack)
        }
        if (roverData.status == 200) {
            robloxId = roverData.data.robloxId
        }
        else {
            try {
                bloxlinkData = await request(`https://api.blox.link/v1/user/${member}`)
                if (bloxlinkData.data.status === "ok") robloxId = bloxlinkData.data.primaryAccount
            }
            catch (e) {
                console.error(e.stack)
            }
        }
        if (!roverData.data.robloxId && !bloxlinkData.data.primaryAccount) return message.channel.send('This user could not be found!')
        try {
            robloxData = await request(`https://api.roblox.com/users/${roverData.data.robloxId}`)
        }
        catch (e) {
            return message.channel.send('Hmm........... something broke. Roblox might be giving me garbage instead of data.')
        }
        if (!robloxData.Username) return message.channel.send('Looks like Roblox deleted this account.')
        try {
            profile = `https://www.roblox.com/users/${robloxData.data.Id}/profile`
            let profileSource = await request(profile)
            joinDate = profileSource.match(/Join Date<p class=text-lead>(.*?)<li/)[1]
            bio = profileSource.match(/<meta name=description content=".*? is one of the millions playing, creating and exploring the endless possibilities of Roblox. Join .*? on Roblox and explore together! ?((?:.|\n)*?)"/m)[1]
            pastNames = profileSource.match(/<span class=tooltip-pastnames data-toggle=tooltip title="?(.*?)"?>/)[1].substr(0, 1024)
            avatar = `https://assetgame.roblox.com/Thumbs/Avatar.ashx?username=${robloxData.data.Username}`
        }
        catch (e) {
            console.error(e.stack)
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
        .setAuthor(robloxData.data.username,profile,avatar)
        .setColor(3756250)
        .setThumbnail(avatar)
        .setDescription(bio)
        .addFields(
            {name: 'Join Date', value: joinDate,inline: true},
            {name: 'Past Usernames',value: pastNames,inline: true}
        )
        return message.channel.send(embed)
    }
}