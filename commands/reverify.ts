import { CommandInteraction } from 'discord.js'

export = {
  name: 'reverify',
  permissions: [],
  async exec (i: CommandInteraction): Promise<void> {
    await i.reply({ content: 'To change your verified account, please visit <https://verify.eryn.io>.', ephemeral: true })
  }
}
