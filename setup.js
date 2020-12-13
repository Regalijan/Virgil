const fs = require('fs')
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
})
console.log('-----Configuration Setup-----')
readline.question('What is your bot token? If you do not have one, get it from https://discord.dev: ', ans => {
  readline.question('What is your bot prefix? ', botprefix => {
    readline.question('What is your database username? ', dbuser => {
      readline.question('What is the hostname or ip address of the database? ', dbhost => {
        readline.question('What is your email provider? (Supported options are mailgun and sendgrid) ', provider => {
          if (provider.toLowerCase() !== 'mailgun' && provider.toLowerCase() !== 'sendgrid') {
            throw new Error('INVALID MAIL PROVIDER (SUPPORTED OPTIONS ARE SENDGRID AND MAILGUN)')
          }
          readline.question('What is the mail domain? ', domain => {
            readline.question('What is the from address? ', from => {
              readline.question('What is your api key? ', apikey => {
                const data = {
                  token: ans,
                  prefix: botprefix,
                  databaseUser: dbuser,
                  databaseAddress: dbhost,
                  databaseName: 'virgil',
                  fromAddress: from,
                  provider: provider,
                  apiKey: apikey
                }
                if (provider.toLowerCase() === 'mailgun') {
                  readline.question('What is your domain region? ', async region => {
                    data.region = region
                    fs.writeFile('./config.json', JSON.stringify(data), err => { if (err) return console.error(err) })
                    readline.close()
                  })
                } else {
                  fs.writeFile('./config.json', JSON.stringify(data), err => { if (err) return console.error(err) })
                  readline.close()
                }
              })
            })
          })
        })
      })
    })
  })
})
