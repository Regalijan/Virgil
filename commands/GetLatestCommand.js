module.exports = {
  name: 'getlatest',
  description: 'Pulls latest version from GitHub',
  async execute (message) {
    const app = require('../index')
    const { exec } = require('child_process')
    if (message.author.id !== (await app).owner.id) return message.channel.send('You do not have permission to run this command!')
    exec('git pull', async function (error, stdout, stderr) {
      if (error) {
        console.error(error)
        return message.channel.send('An error occured when pulling from `origin/main`')
      }
      await message.channel.send(stdout)
      if (stdout.match(/(Already up to date\.)/gim)) return
      await message.channel.send('Restarting...')
      message.client.destroy()
      process.exit(1)
    })
  }
}
