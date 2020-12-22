const config = require('../config.json')
const db = require('../database')
const mailer = require('../mailer')

module.exports = {
    name: 'sendemail',
    description: 'Sends an email',
    guildOnly: true,
    async execute(message, args) {
        if (!message.member.roles.cache.some(role => config.appealsManagerRole.includes(role.id)) && !message.member.hasPermission('ADMINISTRATOR')) return message.channel.send('You do not have permission to run this command!')
        if (!args[0]) return message.channel.send(`SendEmail Usage: \`${config.prefix}sendemail <email/userid>\``)
        let recipient = args[0]
        if (!recipient.match(/@/gm)) {
            recipient = await db.query('SELECT * FROM auth WHERE discord_id = $1;', [args[0]])
            if (recipient.rowCount === 0) return message.channel.send('I could not find anyone with that user id!')
            recipient = recipient.rows[0].email
            if (!recipient.match(/@/)) return message.channel.send('I could not find anyone with that user id!')
        }
        message.channel.send('Enter a subject.').then(async () => {
            let filter = m => message.author.id === m.author.id
            message.channel.awaitMessages(filter, { time: 60000, max: 1, errors: ['time']})
            .then(async subject => {
                let subjectText
                let bodyText
                subject.findKey(s => { subjectText = s.content })
                message.channel.send('Enter the body text').then(async () => {
                    message.channel.awaitMessages(filter, { time: 60000, max: 1, errors: ['time']})
                    .then(async body => {
                        body.findKey(b => { bodyText = b.content })
                        await mailer.execute(subjectText, bodyText, recipient)
                        message.channel.send('Email sent!')
                    })
                    .catch(() => {
                        return message.channel.send('Command timed out.')
                    })
                })
            })
            .catch(() => {
                return message.channel.send('Command timed out.')
            })
        })
    }
}