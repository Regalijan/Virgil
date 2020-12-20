const config = require('./config.json')
const FormData = require('form-data')
const request = require('axios')
module.exports = {
  async execute (subject, body, recipient) {
    if (!config.provider || config.provider.toLowerCase() === 'mailgun') {
      const form = new FormData()
      form.append('from', 'noreply@ccdiscussion.com')
      form.append('to', recipient)
      form.append('subject', subject)
      form.append('html', body)
      if (!config.domain || !config.apiKey) return
      let url
      if (config.mailgunRegion === 'eu') url = `https://api.eu.mailgun.net/v3/${config.domain}/messages`
      else url = `https://api.mailgun.net/v3/${config.domain}/messages`
      const response = await request.post(url, form, { headers: form.getHeaders(), auth: { username: 'api', password: config.apiKey, validateStatus: false } }).catch(e => { return console.error(e) })
      if (response.status !== 200) throw new Error(`HTTP ${response.status}: ${response.data.message}`)
    } else if (config.provider.toLowerCase() === 'sendgrid') {
      const email = JSON.stringify({
        personalizations: [{ to: [{ email: recipient }] }], from: { email: config.fromAddress }, content: [{ type: 'text/html', value: body }]
      })
      const response = await request({
        method: 'POST',
        url: 'https://api.sendgrid.com/v3/mail/send',
        headers: {
          Authorization: `Bearer ${config.apiKey}`
        },
        data: email,
        validateStatus: false
      }).catch(e => { return console.error(e) })
      if (response.status === 200) throw new Error('YOU ARE SENDING EMAILS IN A SANDBOXED ENVIRONMENT, THE MESSAGE WAS NOT SENT!')
      else if (response.status !== 202) throw new Error(`HTTP ${response.status}: ${response.body}`)
    } else throw new Error('INVALID MAIL PROVIDER GIVEN')
  }
}
