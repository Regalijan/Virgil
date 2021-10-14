import axios from 'axios'
import { config as dotenv } from 'dotenv'
import { readdirSync } from 'fs'
import { join } from 'path'
import { ApplicationCommandData } from 'discord.js'

dotenv()

if (!process.env.DISCORDTOKEN) throw Error('No token found in environment!')

const commands: ApplicationCommandData[] = []

for (const file of readdirSync(join(__dirname, 'commands')).filter(f => f.endsWith('.js'))) {
  const cFile = require(`./commands/${file}`)
  commands.push(cFile.interactionData)
}

for (const file of readdirSync(join(__dirname, 'usercontext')).filter(f => f.endsWith('.js'))) {
  const ucFile = require(`./usercontext/${file}`)
  commands.push(ucFile.interactionData)
}

axios('https://discord.com/api/v9/users/@me', {
  headers: {
    authorization: `Bot ${process.env.DISCORDTOKEN}`
  }
}).then(me => {
  axios(`https://discord.com/api/v9/applications/${me.data.id}/commands`, {
    headers: {
      authorization: `Bot ${process.env.DISCORDTOKEN}`,
      'content-type': 'application/json'
    },
    method: 'PUT',
    data: JSON.stringify(commands),
    validateStatus: (() => {
      return true
    })
  }).then(regResponse => {
    console.log(regResponse.status === 200 ? 'Deployment Succeeded': `${JSON.stringify(regResponse.data)}\nAn error occured while deploying! Read the logs above.`)
    process.exit() // ioredis starts for some unknown reason and the process continues to run because of it
  })
})
