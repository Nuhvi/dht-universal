'use strict';
const crypto = require('crypto');
const { Relay } = require('@hyperswarm/dht-relay');
const ws = require('@hyperswarm/dht-relay/ws');
const { WebSocketServer } = require('isomorphic-ws');
const DHT = require('@hyperswarm/dht');

const setupBootstrap = async () => {
  const nodes = [new DHT({ bootstrap: [] }), new DHT({ bootstrap: [] })];

  await Promise.all(nodes.map((node) => node.ready()));

  return {
    bootstrap: nodes.map((n) => ({
      host: '127.0.0.1',
      port: n.address().port,
    })),
    closeBootstrap: () => Promise.all(nodes.map((n) => n.destroy())),
  };
};

const setupNode = async (bootstrap) => {
  const keyPair = DHT.keyPair(Buffer.from('0'.repeat(64), 'hex'));
  const node = new DHT({ keyPair, ephemeral: true });
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
    closeNode: () => node.destroy(),
  };
};

const setupRelay = async (bootstrap) => {
  const dht = new DHT();
  await dht.ready();

  const relay = Relay.fromTransport(ws, dht, new WebSocketServer({ port: 0 }));
  await relay.ready();

  return {
    RELAY_URL: 'ws://127.0.0.1:' + relay._socket.address().port,
    closeRelay: () => Promise.all([relay.close(), dht.destroy()]),
  };
};

/** @type {import('aegir').PartialOptions} */
module.exports = {
  test: {
    async before(options) {
      // const { bootstrap, closeBootstrap } = await setupBootstrap();
      const { DHT_NODE_KEY, TOPIC, closeNode } = await setupNode();
      const { RELAY_URL, closeRelay } = await setupRelay();

      return {
        closeNode,
        closeRelay,
        // closeBootstrap,
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
      // await before.closeBootstrap();
    },
  },
};
