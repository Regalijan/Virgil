const config = require('./config.json')
const FormData = require('form-data')
const request = require('axios')
module.exports = {
  async execute (subject, body, recipient) {
    if (!config.provider || config.provider.toLowerCase() === 'mailgun') {
      const email = new FormData()
        .append('from', config.fromAddress)
        .append('to', recipient)
        .append('subject', subject)
        .append('html', body)
      if (!config.domain || !config.apiKey) return
      let url
      if (config.mailgunRegion === 'eu') url = `https://api.eu.mailgun.net/v3/${config.domain}/messages`
      else url = `https://api.mailgun.net/v3/${config.domain}/messages`
      const response = await request.post(url, email, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Basic ${Buffer.from(`api:${config.apiKey}`).toString('base64')}`
        },
        validateStatus: false
      }).catch(e => { return console.error(e) })
      if (response.status !== 200) throw new Error(`HTTP ${response.status}: ${response.body}`)
    } else if (config.provider.toLowerCase() === 'sendgrid') {
      const email = JSON.stringify({
        personalizations: [{ to: [{ email: recipient }] }], from: { email: config.fromAddress }, content: [{ type: 'text/html', value: body }]
      })
      const response = await request.post('https://api.sendgrid.com/v3/mail/send', email, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`
        },
        validateStatus: false
      }).catch(e => { return console.error(e) })
      if (response.status !== 202) throw new Error(`HTTP ${response.status}: ${response.body}`)
    } else throw new Error('INVALID MAIL PROVIDER GIVEN')
  }
}
