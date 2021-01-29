module.exports = {
  name: 'serverinfo',
  description: 'Displays information of the current server',
  guildOnly: true,
  async execute (message) {
    const { MessageEmbed } = require('discord.js')
    let tcs = 0
    let vcs = 0
    let cats = 0
    message.guild.channels.cache.forEach(c => {
      if (c.type === 'text') tcs++
      if (c.type === 'voice') vcs++
      if (c.type === 'category') cats++
    })
    const embed = new MessageEmbed()
      .setAuthor(message.guild.name, message.guild.iconURL({ dynamic: true }))
      .setColor(3756250)
      .setThumbnail(message.guild.iconURL({ dynamic: true, size: 4096 }))
      .addFields(
        { name: 'Owner', value: message.guild.owner.toString(), inline: true },
        { name: 'Region', value: message.guild.region, inline: true },
        { name: '2FA Required', value: Boolean(message.guild.mfaLevel), inline: true },
        { name: 'Members', value: message.guild.memberCount, inline: true },
        { name: 'Partner Status', value: message.guild.partnered, inline: true },
        { name: 'Verified Status', value: message.guild.verified, inline: true },
        { name: 'Rules Channel', value: message.guild.rulesChannel || 'None', inline: true },
        { name: 'Boost Status', value: `Level ${message.guild.premiumTier} - ${message.guild.premiumSubscriptionCount} boost(s)`, inline: true },
        { name: 'Maximum Members', value: message.guild.maximumMembers, inline: true },
        { name: 'Explicit Filter Level', value: message.guild.explicitContentFilter, inline: true },
        { name: 'Text Channels', value: tcs, inline: true },
        { name: 'Voice Channels', value: vcs, inline: true },
        { name: 'Categories', value: cats, inline: true }
      )
    if (message.guild.splash) embed.setImage(message.guild.splashURL({ size: 4096 }))
    await message.channel.send(embed)
  }
}
