import { CommandInteraction } from 'discord.js'
import Common from '../common'

export = {
  name: 'verify',
  permissions: [],
  interactionData: {
    name: 'verify',
    description: 'Update your Roblox roles and name'
  },
  async exec (i: CommandInteraction): Promise<void> {
    const member = await i.guild?.members.fetch(i.user.id)
    if (!member) return await i.reply({ content: 'An error occured when attempting to verify you - please try again later.', ephemeral: true })
    await i.reply({ content: await Common.verify(member) })
  }
}