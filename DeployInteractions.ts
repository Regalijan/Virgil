import axios from 'axios'
import { config as dotenv } from 'dotenv'

dotenv()

if (!process.env.DISCORDTOKEN) throw Error('No token found in environment!')

const commands = JSON.stringify([
  {
    name: '8ball',
    description: 'What does the future hold?',
    options: [
      {
        type: 3,
        name: 'question',
        description: 'What do you wwant to know?',
        required: true
      }
    ]
  },
  {
    name: 'avatar',
    description: 'Gets avatar of user',
    options: [
      {
        type: 6,
        name: 'user',
        description: 'User to get avatar of'
      }
    ]
  },
  {
    name: 'ban',
    description: 'Bans a user',
    options: [
      {
        type: 6,
        name: 'user',
        description: 'User to ban',
        required: true
      },
      {
        type: 4,
        name: 'days',
        description: 'Days to ban user'
      },
      {
        type: 4,
        name: 'hours',
        description: 'Hours to ban user'
      },
      {
        type: 4,
        name: 'minutes',
        description: 'Minutes to ban user'
      }
    ]
  },
  {
    name: 'birb',
    description: 'Gets picture of birb'
  },
  {
    name: 'bonk',
    description: 'Bonk someone',
    options: [
      {
        type: 6,
        name: 'user',
        description: 'User to bonk',
        required: true
      }
    ]
  },
  {
    name: 'cat',
    description: 'Gets picture of cat'
  },
  {
    name: 'duck',
    description: 'Quack'
  },
  {
    name: 'fact',
    description: 'Gets a fact'
  }
])
