import { config as dotenv } from 'dotenv'
import { readdirSync } from 'fs'
import { join } from 'path'
import {
  Client,
  CommandInteraction,
  Interaction,
  PermissionResolvable
} from 'discord.js'

dotenv()

const cmds: Map<string, {
  name: string,
  permissions: PermissionResolvable[],
  exec (i: CommandInteraction): Promise<void>
}> = new Map()

for (const file of readdirSync(join(__dirname, 'commands')).filter(f => f.endsWith('.js'))) {
  const commandFile = require(`./commands/${file}`)
  cmds.set(commandFile.name, commandFile)
}

const bot = new Client({
  intents: 519
})

bot.login().catch(e => {
  console.error(e)
  process.exit()
})

if (process.env.ENABLEDEBUG) bot.on('debug', function (m) {
  console.log(m)
})

bot.once('ready', function (client) {
  console.log(`Shard ${client.shard.ids[0]} ready with ${client.guilds.cache.size} guilds.`)
})

bot.on('interactionCreate', async function (i: Interaction): Promise<void> {
  if (!i.isCommand() || !cmds.has(i.commandName)) return
  try {
    const command = cmds.get(i.commandName)
    if (!['GUILD_PRIVATE_THREAD', 'GUILD_PUBLIC_THREAD', 'GUILD_TEXT'].includes(i.channel.type)) {
      await i.reply({ content: 'Hey! You can\'t run commands here! They may only be run in a thread or a standard text channel.', ephemeral: true }).catch(e => console.error(e))
      return
    }

    const interactionUser = await i.guild.members.fetch(i.user.id)
    if (command.permissions.length && !interactionUser.permissions.has(command.permissions)) {
      await i.reply({ content: 'You cannot run this command!', ephemeral: true }).catch(e => console.error(e))
      return
    }

    await command.exec(i)
  } catch (e) {
    console.error(e)
    await i.reply({ content: `Oops! An error occured when running this command! If you contact the developer, give them this information: \`${e}\``, ephemeral: true }).catch(e => console.error(e))
  }
})
