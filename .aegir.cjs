'use strict';

/** @type {import('aegir').PartialOptions} */
module.exports = {
  test: {
    async before(options) {
      const DHT = (await import('@hyperswarm/dht')).default;
      const keyPair = DHT.keyPair(Buffer.from('0'.repeat(64), 'hex'));
      const node = new DHT({ keyPair });

      const server = node.createServer();
      await server.listen();

      return {
        node,
      };
    },
    async after(options, before) {
      before.node.destroy();
    },
  },
};
