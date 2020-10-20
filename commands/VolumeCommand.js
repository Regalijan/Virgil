module.exports = {
    name: "volume",
    description: "Changes volume of music anywhere between 0 and 100",
    async execute(message, args) {
        if (((parseInt(args[0])) >= 0) && (parseInt(args[0])) <= 100) {
            const dispatcher = require('./PlayCommand')
            const dispatchercontroller = dispatcher.dispatcher
            if (((message.member.voice.channel) && (message.member.voice.channelID == message.guild.voice.connection.channelID)) || (message.member.hasPermission('MANAGE_GUILD'))) {
                dispatchercontroller.setVolume(args[0]/100)
                return message.channel.send(`Set volume to ${args[0]}.`)
            }
            else if (message.member.voice.channel) {
                return message.channel.send('You must be in the same voice channel as the bot to change the volume!')
            }
            return message.channel.send('You do not have the permissions required to change the volume.')
        }
        return message.channel.send('Volume must be between 0 and 100.')
    }
}