module.exports = {
    name: "play",
    description: "Plays music from youtube",
    async execute(message, args) {
        const ytdl = require('ytdl-core-discord')
        const db = require('../database')
        if (message.member.voice.channel) {
            if ((!message.guild.voice) || (message.member.voice.channel == message.guild.voice.connection.channel)) {
                const connection = await message.member.voice.channel.join()
                async function playTrack() {
                    db.query(`SELECT * FROM musicqueue WHERE guild = ${message.guild.id};`)
                    .then(queue => {
                        async function startTrack() {
                            let songInfo = await ytdl.getInfo(queue.rows[0].media.toString())
                            message.channel.send(`**Now playing ${songInfo.videoDetails.title}**`)
                            const dispatcher = connection.play(await ytdl(queue.rows[0].media.toString()), { type: 'opus' })
                            .on('finish', () => {
                                db.query(`DELETE FROM musicqueue WHERE time = ${queue.rows[0].time.toString()};`).catch(e => console.error(e))
                                dispatcher.destroy()
                                playTrack()
                            })
                            module.exports.dispatcher = dispatcher
                        }
                        if (queue.rows[0]) {
                            startTrack()
                        }
                        else {
                            connection.disconnect()
                            message.channel.send('All tracks have finished.')
                        }
                    }).catch(e => console.error(e))
                }
                if (args[0]) {
                    if (args[0].match(/(https?:\/\/)(www\.|m\.)?(youtube\.com\/watch\?v=\S*[^>])|(https?:\/\/youtu\.be\/\S*[^>])/i)[0]) {
                        let addToQueueQuery = 'INSERT INTO musicqueue(time,requester,media,guild) VALUES($1,$2,$3,$4) RETURNING *;'
                        let addToQueueValues = [Date.now(),message.author.id,args[0].match(/(https?:\/\/)(www\.|m\.)?(youtube\.com\/watch\?v=\S*[^>])|(https?:\/\/youtu\.be\/\S*[^>])/i),message.guild.id]
                        db.query(`SELECT * FROM musicqueue WHERE guild = ${message.guild.id};`)
                        .then(queue => {
                            if (queue.rows[0]) {
                                db.query(addToQueueQuery,addToQueueValues)
                                .then(after => {
                                    async function sendQueuedNotice() {
                                        let songInfo = await ytdl.getInfo(after.rows[0].media.toString())
                                        return message.channel.send(`**Added ${songInfo.videoDetails.title} to the queue.**`)
                                    }
                                    sendQueuedNotice()
                                })
                                .catch(e => {
                                    console.error(e.stack)
                                    message.channel.send(e)
                                })
                            }
                            else {
                                db.query(addToQueueQuery,addToQueueValues)
                                .then(queue => {
                                    playTrack()
                                })
                                .catch(e => {
                                    console.error(e.stack)
                                    message.channel.send(e)
                                })
                            }
                        })
                        .catch(e => {
                            console.error(e.stack)
                            message.channel.send(e)
                        })
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