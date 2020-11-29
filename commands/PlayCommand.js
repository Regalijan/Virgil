const ytdl = require('ytdl-core')
const db = require('../database')
const usetube = require('usetube')
const Discord = require('discord.js')

module.exports = {
    name: "play",
    description: "Plays music from youtube",
    guildOnly: true,
    async execute(message, args) {
        if (message.member.voice.channel) {
            if ((!message.guild.voice) || (!message.guild.voice.connection) || (message.member.voice.channel == message.guild.voice.connection.channel)) {
                const connection = await message.member.voice.channel.join()
                const addToQueueQuery = 'INSERT INTO music_queue(time,requester,media,guild,title) VALUES($1,$2,$3,$4,$5) RETURNING *;'
                const ts = parseInt(Date.now().toString().concat(Math.round(Math.random()*101*1000).toString()))
                async function playTrack() {
                    try {
                        const queue = await db.query(`SELECT * FROM music_queue WHERE guild = ${message.guild.id};`)
                        if (!queue.rows[0]) {
                            connection.disconnect()
                            return message.channel.send('All tracks have finished.')
                        }
                        message.channel.send(`**Now playing ${queue.rows[0].title}**`)
                        const dispatcher = connection.play(ytdl(queue.rows[0].media))
                        .on('finish', () => {
                            db.query(`DELETE FROM music_queue WHERE time = ${queue.rows[0].time.toString()};`).catch(e => console.error(e))
                            dispatcher.destroy()
                            playTrack()
                        })
                        // Export the dispatcher so other commands can use it
                        module.exports.dispatcher = dispatcher
                    }
                    catch (e) {
                        console.error(e)
                    }
                }
                async function processTrack(link,trackTitle) {
                    try {
                        const serverqueue = await db.query(`SELECT * FROM music_queue WHERE guild = ${message.guild.id};`)
                        if (!serverqueue.rows[0]) {
                            await db.query(addToQueueQuery,[ts,message.author.id,link,message.guild.id,trackTitle])
                            playTrack()
                        }
                        else {
                            const newSong = await db.query(addToQueueQuery,[ts,message.author.id,link,message.guild.id,trackTitle])
                            return message.channel.send(`**Added ${newSong[newSong.rowCount - 1].title} to the queue.**`)
                        }
                    }
                    catch (e) {
                        console.error(e)
                    }
                }
                // Parse youtube link
                const ytreg = /(https?:\/\/)(www\.|m\.)?(youtube\.com\/watch\?v=\S*[^>])|(https?:\/\/youtu\.be\/\S*[^>])/i
                if (args && args[0]) {
                    let song
                    let songInfo
                    let title
                    if (args[0].match(ytreg)) {
                        song = args[0].match(ytreg)[0]
                        songInfo = await ytdl.getInfo(song)
                        title = songInfo.videoDetails.title
                        processTrack(args[0].match(ytreg)[0],title)
                    }
                    else {
                        // Join all args to search entire query
                        let query = args.slice(0).join(/ +/)
                        let list = await usetube.searchVideo(query)
                        // Youtube is pissy so try again if it fails
                        if (!list) list = await usetube.searchVideo(query)
                        if (!list) return message.channel.send('I could not retrieve results from youtube, try running this command again.')
                        let length
                        // Cap results to a maximum of 5
                        if (list.tracks.length > 5) length = 5
                        else length = list.tracks.length 
                        const embed = new Discord.MessageEmbed()
                        .setTitle('Search Results')
                        .setColor(3756250)
                        .setDescription('Say a number between 1 and 5 to play the track.')
                        for (let i = 0;i < length;i++) {
                            embed.addField(`\`${i+1}\``,`[${list.tracks[i].title}](https://www.youtube.com/watch?v=${list.tracks[i].id})`)
                        }
                        message.channel.send(embed).then(async () => {
                            const filter = m => message.author.id === m.author.id
                            message.channel.awaitMessages(filter, {time: 30000, max: 1, errors: ['time']}).then(async messages => {
                                let sel = messages.first().content
                                if (parseInt(sel)) sel = parseInt(sel) - 1
                                else return message.channel.send('Invalid selection!')
                                if (sel < 0 || sel > 4) return message.channel.send('Invalid selection!')
                                title = list.tracks[sel].title
                                song = `https://www.youtube.com/watch?v=${list.tracks[sel].id}`
                                processTrack(song,title)
                            })
                        }).catch((e) => {
                            console.log(e)
                            return message.channel.send('Command timed out.')
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