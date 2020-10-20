module.exports = {
    name: "leave",
    description: "Leaves current voice channel",
    execute(message) {
        if (!client.member.voice.channel) {
            return message.channel.send('I\'m not in a voice channel you noob.')
        }
        client.member.voice.channel.leave()
    }
}