import redis from 'ioredis'

const client = new redis(6379, 'redis')
export default client