import { CommandInteraction } from 'discord.js'

export = {
  name: 'owoify',
  permissions: [],
  async exec (i: CommandInteraction): Promise<void> {
    const text = i.options.getString('text', true)
      .replace(/[lr]/g, 'w')
      .replace(/[LR]/g, 'W')
      .replace(/n([aeiou])/g, 'ny$1')
      .replace(/N([aeiou])/g, 'Ny$1')
      .replace(/N([AEIOU])/g, 'Ny$1')
      .replace(/ove/g, 'uv')

    await i.reply({ content: text })
  }
}
