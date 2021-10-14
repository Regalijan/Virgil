import { CommandInteraction, GuildMember, MessageEmbed } from 'discord.js'
import mongo from '../mongo'

const settingsDB = mongo.db('bot').collection('settings')

export = {
  name: 'logs',
  description: 'View, set, or remove a log channel',
  permissions: ['MANAGE_GUILD'],
  interactionData: {
    name: 'logs',
    description: 'View,set, or remove a log channel',
    options: [
      {
        type: 1,
        name: 'list',
        description: 'Lists set log channels',
      },
      {
        type: 1,
        name: 'remove',
        description: 'Disable a log',
        options: [
          {
            type: 3,
            name: 'log',
            description: 'Log to disable',
            required: true,
            choices: [
              {
                name: 'ban',
                value: 'ban'
              },
              {
                name: 'delete',
                value: 'delete'
              },
              {
                name: 'edit',
                value: 'edit'
              },
              {
                name: 'nickname',
                value: 'nickname'
              },
              {
                name: 'role',
                value: 'role'
              },
              {
                name: 'unban',
                value: 'unban'
              },
              {
                name: 'thread_create',
                value: 'thread_create'
              },
              {
                name: 'thread_delete',
                value: 'thread_delete'
              },
              {
                name: 'voice_deafen',
                value: 'voice_deafen'
              },
              {
                name: 'voice_join',
                value: 'voice_join'
              },
              {
                name: 'voice_leave',
                value: 'voice_leave'
              },
              {
                name: 'voice_mute',
                value: 'voice_mute'
              },
              {
                name: 'voice_switch',
                value: 'voice_switch'
              },
              {
                name: 'voice_video',
                value: 'voice_video'
              }
            ]
          }
        ]
      },
      {
        type: 1,
        name: 'set',
        description: 'Sets a log channel',
        options: [
          {
            type: 3,
            name: 'log',
            description: 'Type of log to enable',
            required: true,
            choices: [
              {
                name: 'ban',
                value: 'ban'
              },
              {
                name: 'delete',
                value: 'delete'
              },
              {
                name: 'edit',
                value: 'edit'
              },
              {
                name: 'nickname',
                value: 'nickname'
              },
              {
                name: 'role',
                value: 'role'
              },
              {
                name: 'unban',
                value: 'unban'
              },
              {
                name: 'thread_create',
                value: 'thread_create'
              },
              {
                name: 'thread_delete',
                value: 'thread_delete'
              },
              {
                name: 'voice_deafen',
                value: 'voice_deafen'
              },
              {
                name: 'voice_join',
                value: 'voice_join'
              },
              {
                name: 'voice_leave',
                value: 'voice_leave'
              },
              {
                name: 'voice_mute',
                value: 'voice_mute'
              },
              {
                name: 'voice_switch',
                value: 'voice_switch'
              },
              {
                name: 'voice_video',
                value: 'voice_video'
              }
            ]
          },
          {
            type: 7,
            name: 'channel',
            description: 'Channel to enable logs in',
            required: true
          }
        ]
      }
    ]
  },
  async exec (i: CommandInteraction): Promise<void> {
    const channel = i.options.getChannel('channel')
    const embed = new MessageEmbed()
    if (i.member instanceof GuildMember) embed.setColor(i.member.displayColor)
    const settingsList = await settingsDB.findOne({ guild: i.guildId })
    if (!settingsList) return await i.reply({ content: `The server settings are not ready, ${i.member instanceof GuildMember ? i.member.permissions.has('MANAGE_GUILD') ? '' : 'ask your server admin to' : 'ask your server admin to' } run the \`/initialize\` command.`})
    const choiceToSettingMap: Map<string, string> = new Map()
      .set('ban', 'banLogChannel')
      .set('delete', 'deleteLogChannel')
      .set('edit', 'editLogChannel')
      .set('nickname', 'nicknameLogChannel')
      .set('role', 'roleLogChannel')
      .set('unban', 'unbanLogChannel')
      .set('thread_create', 'threadCreateLogChannel')
      .set('thread_delete', 'threadDeleteLogChannel')
      .set('voice_deafen', 'voiceDeafenLogChannel')
      .set('voice_join', 'voiceJoinLogChannel')
      .set('voice_leave', 'voiceLeaveLogChannel')
      .set('voice_mute', 'voiceMuteLogChannel')
      .set('voice_switch', 'voiceSwitchLogChannel')
      .set('voice_video', 'voiceVideoLogChannel')

    switch (i.options.getSubcommand(true)) {
      case 'list':
        embed.setTitle('Log channels for ' + i.guild?.name)
        embed.setDescription('\u200B')
        embed.addFields(
          { name: 'Ban logs', value: settingsList.banLogChannel ? `<#${settingsList.banLogChannel}>` : 'Not set', inline: true },
          { name: 'Delete logs', value: settingsList.deleteLogChannel ? `<#${settingsList.deleteLogChannel}>` : 'Not set', inline: true },
          { name: 'Edit logs', value: settingsList.editLogChannel ? `<#${settingsList.editLogChannel}>` : 'Not set', inline: true },
          { name: 'Nickname logs', value: settingsList.nicknameLogChannel ? `<#${settingsList.nicknameLogChannel}>` : 'Not set', inline: true },
          { name: 'Role logs', value: settingsList.roleLogChannel ? `<#${settingsList.roleLogChannel}>` : 'Not set', inline: true },
          { name: 'Thread creation logs', value: settingsList.threadCreateLogChannel ? `<#${settingsList.threadCreateLogChannel}` : 'Not set', inline: true },
          { name: 'Thread delete logs', value: settingsList.threadDeleteLogChannel ? `<#${settingsList.threadDeleteLogChannel}` : 'Not set', inline: true },
          { name: 'Unban logs', value: settingsList.unbanLogChannel ? `<#${settingsList.unbanLogChannel}>` : 'Not set', inline: true },
          { name: 'Voice deafen logs', value: settingsList.voiceDeafenLogChannel ? `<#${settingsList.voiceDeafenLogChannel}>` : 'Not set', inline: true },
          { name: 'Voice join logs', value: settingsList.voiceJoinLogChannel ? `<#${settingsList.voiceJoinLogChannel}>`: 'Not set', inline: true },
          { name: 'Voice leave logs', value: settingsList.voiceLeaveLogChannel ? `<#${settingsList.voiceLeaveLogChannel}>` : 'Not set', inline: true },
          { name: 'Voice mute logs', value: settingsList.voiceMuteLogChannel ? `<#${settingsList.voiceMuteLogChannel}>` : 'Not set', inline: true },
          { name: 'Voice channel switch logs', value: settingsList.voiceSwitchLogChannel ? `<#${settingsList.voiceSwitchLogChannel}>` : 'Not set', inline: true },
          { name: 'Voice video logs', value: settingsList.voiceVideoLogChannel ? `<#${settingsList.voiceVideoLogChannel}>` : 'Not set', inline: true }
        )
        return await i.reply({ embeds: [embed] })

      case 'remove':
        const removalChoice = i.options.getString('log', true)
        const $yeet: any = { $unset: {} }
        $yeet.$unset[choiceToSettingMap.get(removalChoice) ?? ''] = ''
        await settingsDB.updateOne({ guild: i.guildId }, $yeet)
        return await i.reply({ content: `\`${removalChoice}\` log disabled!` })

      case 'set':
        const setChoice = i.options.getString('log', true)
        const $set: any = { $set: {} }
        $set.$set[choiceToSettingMap.get(setChoice) ?? ''] = channel?.id
        await settingsDB.updateOne({ guild: i.guildId }, $set)
        return await i.reply({ content: `\`${setChoice}\` log set to <#${i.options.getChannel('channel', true).id}>!` })
    }
  }
}
