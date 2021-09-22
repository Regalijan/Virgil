import { CommandInteraction } from 'discord.js'
import mongo from '../mongo'

const settingsDB = mongo.db('bot').collection('settings')

export = {
  name: 'nicknameformat',
  permissions: ['MANAGE_GUILD'],
  interactionData: {
    name: 'nicknameformat',
    description: 'Set format of nicknames to',
    options: [
      {
        type: 3,
        name: 'format',
        description: 'The format to use when nicknaming a user - Default {{SMARTNAME}}',
        required: true
      }
    ]
  },
  async exec (i: CommandInteraction): Promise<void> {
    settingsDB.findOneAndUpdate({ server: i.guildId }, { $set: { nicknameformat: i.options.get('format', true) } })
  }
}
