import { CommandInteraction } from 'discord.js'

export = {
  name: 'kick',
  permissions: ['KICK_MEMBERS'],
  interactionData: {
    name: 'kick',
    description: 'Kick a user',
    options: [
      {
        type: 6,
        name: 'user',
        description: 'Person to kick',
        required: true
      }
    ]
  },
  privileged: true,
  async exec (i: CommandInteraction): Promise<void> {
    if (!i.guild?.me?.permissions.has('KICK_MEMBERS')) {
      await i.reply({ content: 'I cannot kick that user because I do not have the "Kick Members" permission.', ephemeral: true })
      return
    }

    const user = i.options.getUser('user', true)
    const reason = i.options.getString('reason', false) ?? 'No reason provided.'
    const member = await i.guild.members.fetch(user.id).catch(e => console.error(e))
    if (!member) {
      await i.reply({ content: 'I was unable to locate that user!', ephemeral: true })
      return
    }

    if (user.id === i.user.id) {
      await i.reply({ content: 'You are **not** kicking yourself.', ephemeral: true })
      return
    }

    if (!member.kickable) {
      await i.reply({ content: 'I am not able to kick this user because they are higher on the role list than me.', ephemeral: true })
      return
    }

    const currentMember = await i.guild.members.fetch(i.user.id).catch(e => console.error(e))

    if (!currentMember) {
      await i.reply({ content: 'An error occured when checking permissions - please try again later.', ephemeral: true })
      return
    }

    if (member.roles.highest.comparePositionTo(currentMember.roles.highest) <= 0) {
      await i.reply({ content: 'You do not have permission to kick this user!', ephemeral: true })
      return
    }
    
    await user.send({ content: `You have been kicked from ${i.guild.name} for the following reason:\n\n${reason}` }).catch(() => {})
    try {
      await member.kick(reason)
    } catch (e) {
      console.error(e)
      await i.reply({ content: `I was unable to kick the user for the following reason:\n\n${e}`, ephemeral: true })
    }
  }
}
