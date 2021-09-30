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
                name: 'voice_join',
                value: 'voice_join'
              },
              {
                name: 'voice_leave',
                value: 'voice_leave'
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
                nave: 'voice_video',
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
          { name: 'Ban logs', value: settingsList?.banLogChannel ? `<#${settingsList.banLogChannel}>` : 'Not set' },
          { name: 'Delete logs', value: settingsList?.deleteLogChannel ? `<#${settingsList.deleteLogChannel}>` : 'Not set' },
          { name: 'Edit logs', value: settingsList?.editLogChannel ? `<#${settingsList.editLogChannel}>` : 'Not set' },
          { name: 'Nickname logs', value: settingsList?.nicknameLogChannel ? `<#${settingsList.nicknameLogChannel}>` : 'Not set' },
          { name: 'Role logs', value: settingsList?.roleLogChannel ? `<#${settingsList.roleLogChannel}>` : 'Not set' },
          { name: 'Unban logs', value: settingsList?.unbanLogChannel ? `<#${settingsList.unbanLogChannel}>` : 'Not set' },
          { name: 'Voice join logs', value: settingsList?.voiceJoinLogChannel ? `<#${settingsList.voiceJoinLogChannel}>`: 'Not set' },
          { name: 'Voice leave logs', value: settingsList?.voiceLeaveLogChannel ? `<#${settingsList.voiceLeaveLogChannel}>` : 'Not set' }
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
