import {
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMFALevel,
} from "discord.js";

export = {
  name: "serverinfo",
  async exec(i: ChatInputCommandInteraction): Promise<void> {
    if (!i.guild) {
      await i.reply({
        content: "Oops! Looks like I don't have any information available!",
        ephemeral: true,
      });
      return;
    }

    let textChannels = 0;
    let voiceChannels = 0;
    let newsChannels = 0;
    let stageChannels = 0;
    let threads = 0;
    let categories = 0;
    i.guild?.channels.cache.forEach((channel) => {
      if (channel.type === ChannelType.GuildCategory) categories++;
      if (channel.type === ChannelType.GuildVoice) voiceChannels++;
      if (
        [
          ChannelType.GuildNewsThread,
          ChannelType.GuildPrivateThread,
          ChannelType.GuildPublicThread,
        ].includes(channel.type)
      )
        threads++;
      if (channel.type === ChannelType.GuildStageVoice) stageChannels++;
      if (channel.type === ChannelType.GuildNews) newsChannels++;
      if (channel.type === ChannelType.GuildText) textChannels++;
    });

    const embed = new EmbedBuilder()
      .setAuthor({
        name: i.user.tag,
        iconURL: i.user.displayAvatarURL(),
      })
      .addFields(
        { name: "Owner", value: `<@${i.guild.ownerId}>`, inline: true },
        {
          name: "2FA Required",
          value: i.guild.mfaLevel === GuildMFALevel.Elevated ? "Yes" : "No",
          inline: true,
        },
        {
          name: "Members",
          value: i.guild.memberCount.toString(),
          inline: true,
        },
        {
          name: "Partnered",
          value: i.guild.partnered ? "Yes" : "No",
          inline: true,
        },
        {
          name: "Verified",
          value: i.guild.verified ? "Yes" : "No",
          inline: true,
        },
        {
          name: "Rules Channel",
          value: i.guild.rulesChannel?.toString() ?? "None",
          inline: true,
        },
        {
          name: "Boost Tier",
          value: i.guild.premiumTier.toString(),
          inline: true,
        },
        {
          name: "Member Cap",
          value: i.guild.maximumMembers?.toString() ?? "Unknown",
          inline: true,
        },
        { name: "Categories", value: `${categories}`, inline: true },
        { name: "Text Channels", value: `${textChannels}`, inline: true },
        { name: "Threads", value: `${threads}`, inline: true },
        { name: "News Channels", value: `${newsChannels}`, inline: true },
        { name: "Stage Channels", value: `${stageChannels}`, inline: true },
        { name: "Voice Channels", value: `${voiceChannels}`, inline: true },
      );
    const splashUrl = i.guild.splashURL({ size: 4096 });
    const iconUrl = i.guild.iconURL();
    if (splashUrl) embed.setImage(splashUrl);
    if (iconUrl) embed.setThumbnail(iconUrl);
    const member = await i.guild.members
      .fetch(i.user.id)
      .catch((e) => console.error(e));
    if (member) embed.setColor(member.displayColor);
    await i.reply({ embeds: [embed] });
  },
};
