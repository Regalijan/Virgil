const config = require('../config.json')
const db = require('../database')
const FormData = require('form-data')
const request = require('axios')

module.exports = {
  name: 'accept',
  description: 'Accepts user\'s appeal',
  guildOnly: true,
  execute (message, args) {
    if (message.member.roles.cache.some(role => config.appealsManagerRole.includes(role.id))) {
      const userval = args[0]
      db.query('SELECT * FROM appeals WHERE discord_id = $1;', userval)
        .then(appeal => {
          if (appeal.rows[0]) {
            db.query('SELECT * FROM auth WHERE discord_id = $1;', userval)
              .then(email => {
                const form = new FormData()
                form.append('from', config.fromAddress)
                form.append('to', email.rows[0].email)
                form.append('subject', 'Appeal Accepted')
                form.append('html', `<html>Your appeal was accepted, you may join us again at our <a href="${config.appealsInvite}" target="_blank">discord server</a>.<br/><br/>Note from the moderation team: ${args[1]}</html>`)
                const apiKey = Buffer.from(`api:${config.mailgunApiKey}`, 'utf8').toString('base64')
                let sendingUrl = `https://api.mailgun.net/v3/${config.mailgunDomain}/messages`
                if (config.mailgunRegion === 'eu') {
                  sendingUrl = `https://api.eu.mailgun.net/v3/${config.mailgunDomain}/messages`
                }
                request({
                  method: 'POST',
                  url: sendingUrl,
                  headers: {
                    Authorization: `Basic ${apiKey}`
                  },
                  form: form
                })
                  .then(response => {
                    if (response.status === 200) {
                      db.query('DELETE FROM appeals WHERE discord_id = $1;', userval)
                        .catch(e => console.error(e))
                      return message.channel.send('Appeal accepted!')
                    }
                    return message.channel.send(`Mailgun returned an error! ${response.status.code} ${response.body}`)
                  })
                  .catch(e => console.error(e))
              })
              .catch(e => console.error(e))
          } else {
            return message.channel.send('This user don\'t exist in le database')
          }
        })
    }
  }
}
