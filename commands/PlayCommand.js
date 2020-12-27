const db = require('../database')
const Discord = require('discord.js')
const ytdl = require('ytdl-core')
const ytsr = require('ytsr')

module.exports = {
  name: 'play',
  description: 'Plays music from youtube',
  guildOnly: true,
  async execute (message, args) {
    if (message.member.voice.channel) {
      if ((!message.guild.voice) || (!message.guild.voice.connection) || (message.member.voice.channel === message.guild.voice.connection.channel)) {
        const ytreg = /(https?:\/\/)(www\.|m\.)?(youtube\.com\/watch\?v=\S*[^>])|(https?:\/\/youtu\.be\/\S*[^>])/i
        const urlreg = /(([\w]+:)?\/\/)?(([\d\w]|%[a-fA-f\d]{2,2})+(:([\d\w]|%[a-fA-f\d]{2,2})+)?@)?([\d\w][-\d\w]{0,253}[\d\w]\.)+[\w]{2,63}(:[\d]+)?(\/([-+_~.\d\w]|%[a-fA-f\d]{2,2})*)*(\?(&?([-+_~.\d\w]|%[a-fA-f\d]{2,2})=?)*)?(#([-+_~.\d\w]|%[a-fA-f\d]{2,2})*)?/
        const connection = await message.member.voice.channel.join()
        const addToQueueQuery = 'INSERT INTO music_queue(time,requester,media,guild,title) VALUES($1,$2,$3,$4,$5) RETURNING *;'
        const ts = parseInt(Date.now().toString().concat(Math.round(Math.random() * 1000000).toString()))
        async function playTrack () {
          try {
            const queue = await db.query(`SELECT * FROM music_queue WHERE guild = ${message.guild.id};`)
            if (!queue.rows[0]) {
              connection.disconnect()
              return message.channel.send('All tracks have finished.')
            }
            message.channel.send(`**Now playing ${queue.rows[0].title}**`)
            let dispatcher
            if (queue.rows[0].media.match(ytreg)) dispatcher = connection.play(ytdl(queue.rows[0].media))
            else {
              try {
                dispatcher = connection.play(queue.rows[0].media)
              } catch {
                return message.channel.send('FFmpeg is not installed! Music is disabled.')
              }
            }
            dispatcher.on('finish', () => {
              db.query(`DELETE FROM music_queue WHERE time = ${queue.rows[0].time.toString()};`).catch(e => console.error(e))
              dispatcher.destroy()
              playTrack()
            })
            dispatcher.on('error', e => {
              console.error(e)
            })
            // Export the dispatcher so other commands can use it
            module.exports.dispatcher = dispatcher
          } catch (e) {
            console.error(e)
          }
        }
        async function processTrack (link, trackTitle) {
          try {
            const serverqueue = await db.query(`SELECT * FROM music_queue WHERE guild = ${message.guild.id};`)
            if (!serverqueue.rows[0]) {
              await db.query(addToQueueQuery, [ts, message.author.id, link, message.guild.id, trackTitle])
              playTrack()
            } else {
              await db.query(addToQueueQuery, [ts, message.author.id, link, message.guild.id, trackTitle])
              return message.channel.send(`**Added ${trackTitle} to the queue.**`)
            }
          } catch (e) {
            console.error(e)
          }
        }
        // Parse youtube link
        if (args && args[0]) {
          let song
          let songInfo
          let title
          if (args[0].match(ytreg)) {
            song = args[0].match(ytreg)[0]
            songInfo = await ytdl.getInfo(song)
            title = songInfo.videoDetails.title
            processTrack(args[0].match(ytreg)[0], title)
          } else if (args[0] && args[0].match(urlreg)) {
            const source = args[0].match(urlreg)[0]
            processTrack(source, source)
          } else {
            // Join all args to search entire query
            const query = args.slice(0).join(' ')
            const list = await ytsr(query, { limit: 10 }).catch(e => console.error(e))
            if (!list) return message.channel.send('No search results :(')
            const length = list.items.length
            const embed = new Discord.MessageEmbed()
              .setTitle('Search Results')
              .setColor(3756250)
              .setDescription('Say a number between 1 and 10 to play the track.')
            for (let i = 0; i < length; i++) {
              embed.addField(`\`${i + 1}\``, `[${list.items[i].title}](https://www.youtube.com/watch?v=${list.items[i].id})`)
            }
            message.channel.send(embed).then(async () => {
              const filter = m => message.author.id === m.author.id
              message.channel.awaitMessages(filter, { time: 60000, max: 1, errors: ['time'] }).then(async messages => {
                let sel = messages.first().content
                if (parseInt(sel)) sel = parseInt(sel) - 1
                else return message.channel.send('Invalid selection!')
                if (sel < 0 || sel > length - 1) return message.channel.send('Invalid selection!')
                title = list.items[sel].title
                song = `https://www.youtube.com/watch?v=${list.items[sel].id}`
                processTrack(song, title)
              })
            }).catch(() => message.channel.send('Command timed out.'))
          }
        } else {
          playTrack()
        }
        connection.on('error', e => {
          console.error(e)
        })
      }
    } else {
      return message.channel.send('Join a voice channel first noob.')
    }
  }
}
