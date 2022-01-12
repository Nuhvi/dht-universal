'use strict';
const b4a = require('b4a');
const crypto = require('crypto');

/** @type {import('aegir').PartialOptions} */
module.exports = {
  test: {
    async before(options) {
      const DHT = (await import('@hyperswarm/dht')).default;
      const keyPair = DHT.keyPair(Buffer.from('0'.repeat(64), 'hex'));
      const node = new DHT({ keyPair });

      const server = node.createServer();
      await server.listen();
      server.on('connection', (socket) => {
        socket.write('hello');
      });

      const topic = crypto
        .createHash('sha256')
        .update(keyPair.publicKey)
        .digest();

      await node.announce(topic, keyPair).finished();

      return {
        node,
      };
    },
    async after(options, before) {
      before.node.destroy();
    },
  },
};
