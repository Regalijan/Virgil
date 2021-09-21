import axios from 'axios'
import { config as dotenv } from 'dotenv'
import { readdir } from 'fs/promises'
import { join } from 'path'
import { ApplicationCommandData } from 'discord.js'

dotenv()

if (!process.env.DISCORDTOKEN) throw Error('No token found in environment!')

const commands: ApplicationCommandData[] = []

;(async function (): Promise<void> {
  const apiSelf = await axios('https://discord.com/api/v9/users/@me', {
    headers: {
      authorization: `Bot ${process.env.DISCORDTOKEN}`
    }
  })
  const uid = apiSelf.data.id
  for (const file of await readdir(join(__dirname, 'commands'))) {
    const cFile = require(`./commands/${file}`)
    commands.push(cFile.interactionData)
  }
  const registerResponse = await axios(`https://discord.com/api/v9/applications/${uid}/commands`, {
    headers: {
      authorization: `Bot ${process.env.DISCORDTOKEN}`,
      'content-type': 'application/json'
    },
    method: 'PUT',
    data: JSON.stringify(commands),
    validateStatus: (() => {
      return true
    })
  })
  console.log(registerResponse.status === 200 ? 'Deployment succeeded' : `${JSON.stringify(registerResponse.data)}\nAn error occured while deploying! Read the logs above.`)
  process.exit()
}())
