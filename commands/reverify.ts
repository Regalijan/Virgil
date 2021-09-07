import { CommandInteraction, MessageActionRow, MessageButton } from 'discord.js'

export = {
  name: 'reverify',
  permissions: [],
  async exec (i: CommandInteraction): Promise<void> {
    const button = new MessageButton()
      .setURL('https://rover.link/my/verification')
      .setEmoji(':pencil2:')
      .setLabel('Change Account')
    await i.reply({ content: 'To change your verified account, click the link below.', ephemeral: true, components: [new MessageActionRow({ components: [button] })] })
  }
}
