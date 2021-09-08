import { CommandInteraction, MessageActionRow, MessageButton } from 'discord.js'

export = {
  name: 'reverify',
  permissions: [],
  interactionData: {
    name: 'reverify',
    description: 'Change your linked Roblox account'
  },
  async exec (i: CommandInteraction): Promise<void> {
    const button = new MessageButton()
      .setURL('https://rover.link/my/verification')
      .setEmoji('✏️')
      .setLabel('Change Account')
      .setStyle('LINK')
    await i.reply({ content: 'To change your verified account, click the link below.', ephemeral: true, components: [new MessageActionRow({ components: [button] })] })
  }
}
