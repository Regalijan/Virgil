module.exports = {
  name: 'reverify',
  properName: 'Reverify',
  description: 'Sends links to change your verified account(s)',
  guildOnly: true,
  async execute (message) {
    message.reply('To change your verified account, please visit <https://verify.eryn.io>.')
  }
}
