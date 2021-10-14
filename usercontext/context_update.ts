import { ContextMenuInteraction } from 'discord.js'
import Common from '../common'

export = {
  name: 'context_update',
  permissions: [],
  interactionData: {
    name: 'context_update',
    type: 2
  },

  async exec (i: ContextMenuInteraction): Promise<void> {
    if (i.targetType !== 'USER') return await i.reply({ content: 'User context expected but given message.', ephemeral: true })
    const member = await i.guild?.members.fetch(i.user.id)
    if (!member) return await i.reply({ content: '`Error: <ContextMenuInteraction>.guild is null`', ephemeral: true })
    if (i.targetId !== i.user.id && !member.permissions.has('MANAGE_GUILD')) return await i.reply({ content: 'Oops! You do not have permission to use this command; if you want to verify yourself, please run `/verify`', ephemeral: true })
    await i.reply({ content: await Common.verify(member, i.targetId === i.user.id), ephemeral: true })
  }
}
