'use strict';
const crypto = require('crypto');
const { Relay } = require('@hyperswarm/dht-relay');
const ws = require('@hyperswarm/dht-relay/ws');
const { WebSocketServer } = require('isomorphic-ws');
const DHT = require('@hyperswarm/dht');

const setupNode = async () => {
  const keyPair = DHT.keyPair(Buffer.from('0'.repeat(64), 'hex'));
  const node = new DHT({ keyPair });
  await node.ready();

  const server = node.createServer();
  await server.listen();
  server.on('connection', (socket) => {
    socket.write('hello');
    socket.end();
  });

  const topic = crypto
    .createHash('sha256')
    .update(node.defaultKeyPair.publicKey)
    .digest();

  await node.announce(topic, node.defaultKeyPair).finished();

  return {
    DHT_NODE_KEY: node.defaultKeyPair.publicKey.toString('hex'),
    TOPIC: topic.toString('hex'),
    closeNode: async () => Promise.all([node.destroy()]),
  };
};

const setupRelay = async () => {
  const dht = new DHT();
  await dht.ready();

  const relay = Relay.fromTransport(ws, dht, new WebSocketServer({ port: 0 }));
  await relay.ready();

  return {
    RELAY_URL: 'ws://127.0.0.1:' + relay._socket.address().port,
    closeRelay: async () => Promise.all([relay.close(), dht.destroy()]),
  };
};

/** @type {import('aegir').PartialOptions} */
module.exports = {
  test: {
    async before(options) {
      const { DHT_NODE_KEY, TOPIC, closeNode } = await setupNode();
      const { RELAY_URL, closeRelay } = await setupRelay();

      return {
        closeNode,
        closeRelay,
        env: {
          DHT_NODE_KEY,
          TOPIC,
          RELAY_URL,
        },
      };
    },
    async after(options, before) {
      await before.closeNode();
      await before.closeRelay();
    },
  },
};
