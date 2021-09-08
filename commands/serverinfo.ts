import { CommandInteraction, MessageEmbed } from 'discord.js'

export = {
  name: 'serverinfo',
  permissions: [],
  interactionData: {
    name: 'serverinfo',
    description: 'Displays server information'
  },
  async exec (i: CommandInteraction): Promise<void> {
    if (!i.guild) {
      await i.reply({ content: 'Oops! Looks like I don\'t have any information available!', ephemeral: true })
      return
    }

    let textChannels = 0
    let voiceChannels = 0
    let newsChannels = 0
    let stageChannels = 0
    let threads = 0
    let categories = 0
    i.guild?.channels.cache.forEach(channel => {
      if (channel.type === 'GUILD_CATEGORY') categories++
      if (channel.type === 'GUILD_VOICE') voiceChannels++
      if (['GUILD_NEWS_THREAD', 'GUILD_PRIVATE_THREAD', 'GUILD_PUBLIC_THREAD'].includes(channel.type)) threads++
      if (channel.type === 'GUILD_STAGE_VOICE') stageChannels++
      if (channel.type === 'GUILD_NEWS') newsChannels++
      if (channel.type === 'GUILD_TEXT') textChannels++
    })

    const embed = new MessageEmbed()
      .setAuthor(i.user.tag, i.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'Owner', value: `<@${i.guild.ownerId}>`, inline: true },
        { name: '2FA Required', value: i.guild.mfaLevel === 'ELEVATED' ? 'Yes' : 'No', inline: true },
        { name: 'Members', value: i.guild.memberCount.toString(), inline: true },
        { name: 'Partnered', value: i.guild.partnered ? 'Yes' : 'No', inline: true },
        { name: 'Verified', value: i.guild.verified ? 'Yes' : 'No', inline: true },
        { name: 'Rules Channel', value: i.guild.rulesChannel?.toString() ?? 'None', inline: true },
        { name: 'Boost Tier', value: i.guild.premiumTier.toString(), inline: true },
        { name: 'Member Cap', value: i.guild.maximumMembers?.toString() ?? 'Unknown', inline: true },
        { name: 'Categories', value: `${categories}`, inline: true },
        { name: 'Text Channels', value: `${textChannels}`, inline: true },
        { name: 'Threads', value: `${threads}`, inline: true },
        { name: 'News Channels', value: `${newsChannels}`, inline: true },
        { name: 'Stage Channels', value: `${stageChannels}`, inline: true },
        { name: 'Voice Channels', value: `${voiceChannels}`, inline: true }
      )
    const splashUrl = i.guild.splashURL({ size: 4096 })
    const iconUrl = i.guild.iconURL({ dynamic: true })
    if (splashUrl) embed.setImage(splashUrl)
    if (iconUrl) embed.setThumbnail(iconUrl)
    const member = await i.guild.members.fetch(i.user.id).catch(e => console.error(e))
    if (member) embed.setColor(member.displayColor)
    await i.reply({ embeds: [embed] })
  }
}
