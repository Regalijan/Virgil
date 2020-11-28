const ytdl = require('ytdl-core')
const db = require('../database')

module.exports = {
    name: "play",
    description: "Plays music from youtube",
    guildOnly: true,
    async execute(message, args) {
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
                            let songInfo = await ytdl.getInfo(queue.rows[0].media.toString())
                            message.channel.send(`**Now playing ${songInfo.videoDetails.title}**`)
                        }
                        catch (e) {
                            console.error(e)
                            message.channel.send('Failed to retrieve video metadata!')
                        }
                        const dispatcher = connection.play(ytdl(queue.rows[0].media))
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
                    let song = args[0].match(/(https?:\/\/)(www\.|m\.)?(youtube\.com\/watch\?v=\S*[^>])|(https?:\/\/youtu\.be\/\S*[^>])/i)[0]
                    let songInfo = await ytdl.getInfo(song)
                    let addToQueueQuery = 'INSERT INTO musicqueue(time,requester,media,guild,title) VALUES($1,$2,$3,$4,$5) RETURNING *;'
                    let addToQueueValues = [Date.now(),message.author.id,song,message.guild.id,songInfo.videoDetails.title]
                    try {
                        const serverqueue = await db.query(`SELECT * FROM musicqueue WHERE guild = ${message.guild.id};`)
                        if (!serverqueue.rows[0]) {
                            await db.query(addToQueueQuery,addToQueueValues)
                            playTrack()
                        }
                        else {
                            const newSong = await db.query(addToQueueQuery,addToQueueValues)
                            let title = newSong[newSong.rowCount - 1].title
                            return message.channel.send(`**Added ${title.videoDetails.title} to the queue.**`)
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