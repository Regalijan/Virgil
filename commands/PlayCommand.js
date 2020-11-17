module.exports = {
    name: "play",
    description: "Plays music from youtube",
    guildOnly: true,
    async execute(message, args) {
        const ytdl = require('ytdl-core-discord')
        const db = require('../database')
        if (message.member.voice.channel) {
            if ((!message.guild.voice) || (!message.guild.voice.connection) || (message.member.voice.channel == message.guild.voice.connection.channel)) {
                const connection = await message.member.voice.channel.join()
                async function playTrack() {
                    try {
                        const queue = await db.query(`SELECT * FROM musicqueue WHERE guild = ${message.guild.id};`)
                        if (!queue.rows[0]) {
                            connection.disconnect()
                            return message.channel.send('All tracks have finished.')
                        }
                        try {
                            let songInfo = await ytdl.getInfo(queue.rows[0].media)
                            message.channel.send(`**Now playing ${songInfo.videoDetails.title}**`)
                        }
                        catch (e) {
                            console.error(e)
                        }
                        const dispatcher = connection.play(await ytdl(queue.rows[0].media), { type: 'opus'})
                        .on('finish', () => {
                            db.query(`DELETE FROM musicqueue WHERE time = ${queue.rows[0].time.toString()};`).catch(e => console.error(e))
                            dispatcher.destroy()
                            playTrack()
                        })
                        module.exports.dispatcher = dispatcher
                    }
                    catch (e) {
                        console.error(e)
                    }
                }
                if (args && args[0] && args[0].match(/(https?:\/\/)(www\.|m\.)?(youtube\.com\/watch\?v=\S*[^>])|(https?:\/\/youtu\.be\/\S*[^>])/i)[0]) {
                    let addToQueueQuery = 'INSERT INTO musicqueue(time,requester,media,guild) VALUES($1,$2,$3,$4) RETURNING *;'
                    let addToQueueValues = [Date.now(),message.author.id,args[0].match(/(https?:\/\/)(www\.|m\.)?(youtube\.com\/watch\?v=\S*[^>])|(https?:\/\/youtu\.be\/\S*[^>])/i)[0],message.guild.id]
                    try {
                        const serverqueue = await db.query(`SELECT * FROM musicqueue WHERE guild = ${message.guild.id};`)
                        if (!serverqueue.rows[0]) {
                            await db.query(addToQueueQuery,addToQueueValues)
                            playTrack()
                        }
                        else {
                            const newSong = await db.query(addToQueueQuery,addToQueueValues)
                            let songInfo = await ytdl.getInfo(newSong.rows[newSong.rowCount - 1].media)
                            return message.channel.send(`**Added ${songInfo.videoDetails.title} to the queue.**`)
                        }
                    }
                    catch (e) {
                        console.error(e)
                    }
                }
                else {
                    playTrack()
                }
            }
        }
        else {
            return message.channel.send('Join a voice channel first noob.')
        }
    }
}