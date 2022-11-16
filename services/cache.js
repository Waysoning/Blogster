const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');

const redisUrl = 'redis://127.0.0.1:6379';
const client = redis.createClient(redisUrl);
client.hget = util.promisify(client.hget);
const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.exec = async function () {
  // unique key for each query
  const key = JSON.stringify(
    Object.assign({}, this.getQuery(), {
      collection: this.mongooseCollection.name,
    })
  );

  // See if we have a value for 'key' in redis
  const cacheValue = await client.get(key);

  // If we do, return that
  if (cacheValue) {
    console.log(cacheValue);
  }

  // Otherwise, issue the query and store the result in redis
  const result = await exec.apply(this, arguments);

  client.set(key, JSON.stringify(result));

  return result;
};
