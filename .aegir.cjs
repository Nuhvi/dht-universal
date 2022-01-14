'use strict';
const crypto = require('crypto');
const { Relay } = require('@hyperswarm/dht-relay');
const ws = require('@hyperswarm/dht-relay/ws');
const { WebSocketServer } = require('isomorphic-ws');
const DHT = require('@hyperswarm/dht');

const serverNode = async () => {
  const keyPair = DHT.keyPair(Buffer.from('0'.repeat(64), 'hex'));
  const node = new DHT({ keyPair });
  await node.ready();

  const server = node.createServer();
  await server.listen();
  server.on('connection', (socket) => {
    socket.write('hello');
    socket.end();
  });

  const topic = crypto.createHash('sha256').update(keyPair.publicKey).digest();

  await node.announce(topic, keyPair).finished();

  return node;
};

/** @type {import('aegir').PartialOptions} */
module.exports = {
  test: {
    async before(options) {
      const node = await serverNode();
      // const dhtForRelay = new DHT();
      // await dhtForRelay.ready();

      // const relay = Relay.fromTransport(
      //   ws,
      //   dhtForRelay,
      //   new WebSocketServer({ port: 9999 }),
      // );
      // await relay.ready();

      return {
        node,
        // relay,
      };
    },
    async after(options, before) {
      await before.node.destroy();
    },
  },
};
