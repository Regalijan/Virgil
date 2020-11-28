const Discord = require('discord.js')
const db = require('../database')
const ytdl = require('ytdl-core')

module.exports = {
    name: "queue",
    description: "Shows all tracks in the queue",
    guildOnly: true,
    async execute(message) {
        const queue = await db.query(`SELECT * FROM musicqueue WHERE guild = ${message.guild.id};`).catch (e => {
            console.error(e)
            return message.channel.send(`Could not retrieve queue! ${e}`)
        })
        if (!queue.rows[0]) return message.channel.send('There are no tracks in the queue.')
        const embed = new Discord.MessageEmbed()
        .setTitle('Queue')
        .setColor(3756250)
        .addField('Current Track', `[${queue.rows[0].title}](${queue.rows[0].media}) - Requested by <@${queue.rows[0].requester}>`)
        if (queue.rows[1]) {
            for (let i = 1;i < queue.rowCount;i++) {
                embed.addField(`\`${i}.\``,`[${queue.rows[i].title}](${queue.rows[i].media}) - Requested by <@${queue.rows[i].requester}>`)
            }
        }
        return message.channel.send(embed)
    }
}