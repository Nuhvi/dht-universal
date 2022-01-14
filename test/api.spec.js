import { expect } from 'aegir/utils/chai.js'
import crypto from 'hypercore-crypto'
import b4a from 'b4a'

/** @typedef {import ('../src/interfaces').DHT} _DHT */

/**
 * @param {_DHT} DHT
 */
export const test = (DHT) => {
  const VALID_RELAY_SERVER = 'wss://dht-relay.synonym.to/'
  const INVALID_RELAY_SERVER = 'ws://invalid.something.net'

  const DHT_KEY = b4a.from(
    '3b6a27bcceb6a42d62a3a8d02a6f0d73653215771de243a63ac048a18b59da29',
    'hex'
  )

  const topic = b4a.from(
    '139e3940e64b5491722088d9a0d741628fc826e09475d341a780acde3c4b8070',
    'hex'
  )

  const keyPair = crypto.keyPair(b4a.from('1'.repeat(64), 'hex'))

  const nodes = []

  /**
   * @param {import('../src/interfaces').DHTOpts} [opts]
   * @returns {Promise<_DHT>}
   */
  const createNode = async (opts) => {
    if (process.title !== 'node') opts = { ...opts, relay: VALID_RELAY_SERVER }

    const node = new DHT(opts)
    nodes.push(node)
    // await node.ready();
    return node
  }

  const cleanNodes = async () =>
    Promise.all(nodes.map((node) => node.ready().then((_) => node.destroy())))

  describe('Static methods', () => {
    describe('DHT.keyPair', () => {
      it('should create a keyPair without a seed', () => {
        const keyPair = DHT.keyPair()
        expect(Object.keys(keyPair)).to.eql(['publicKey', 'secretKey'])
      })

      it('should create a keyPair from a seed', () => {
        const _keyPair = DHT.keyPair(b4a.from('1'.repeat(64), 'hex'))
        expect(_keyPair).to.eql(keyPair)
      })
    })
  })

  describe('API', () => {
    after(cleanNodes)

    describe('Instantiation', () => {
      it('should accept a defaultKeyPair', async () => {
        const node = await createNode({ keyPair })
        expect(node.defaultKeyPair.publicKey).to.eql(keyPair.publicKey)
      })
    })

    describe('node.destroy()', () => {
      it('should destroy node and close servers', async () => {
        const node = await createNode()
        await node.ready()
        const server = node.createServer()
        await server.listen()

        expect(server.closed).to.be.false('server should not be closed')
        expect(node.destroyed).to.be.false('node should not be destroyed')

        await node.destroy()

        expect(server.closed).to.be.true('server should be closed')
        expect(node.destroyed).to.be.true('node should be destroyed')
      })

      it('should force destroy node and skip close servers', async () => {
        const node = await createNode()
        await node.ready()
        const server = node.createServer()
        await server.listen()

        expect(server.closed).to.be.false('server should not be closed')
        expect(node.destroyed).to.be.false('node should not be destroyed')

        await node.destroy({ force: true })

        expect(server.closed).to.be.false('server should not be closed')
        expect(node.destroyed).to.be.true('node should be destroyed')

        server.close()
      })
    })
  })

  describe('Creating P2P servers', () => {
    after(cleanNodes)

    describe('node.createServer', () => {
      it('should create a server and accept an onconnection callback', async () => {
        const node1 = await createNode()

        const server = node1.createServer((secretStream) => {
          // eslint-disable-next-line
          secretStream.on('data', (data) =>
            expect(data).to.eql(b4a.from('hello'))
          )
        })

        await server.listen()

        const node2 = await createNode()
        const secretStream = node2.connect(server.publicKey)

        expect(
          await new Promise((resolve, reject) => {
            secretStream.on('error', (error) => reject(error))
            secretStream.on('open', () => {
              secretStream.write('hello')
              resolve(true)
            })
          })
        ).to.be.true()
      })

      it.skip('should create a server and accept a firewall function', async () => {
        const node1 = await createNode()
        const node2 = await createNode()

        const server = node1.createServer({
          firewall: (remotePublicKey, remoteHandshakePayload) => {
            expect(remotePublicKey).to.eql(node2.defaultKeyPair.publicKey)
            expect(remoteHandshakePayload).to.eql({
              version: 1,
              error: 0,
              firewall: 0,
              protocols: 3,
              holepunch: null,
              addresses: []
            })

            return true
          },
          onconnection: (secretStream) =>
            expect(true).to.be.false('should not connect')
        })

        await server.listen()

        const secretStream = node2.connect(server.publicKey)

        expect(
          await new Promise((resolve, reject) => {
            secretStream.on('error', (error) => {
              resolve(error.message)
            })
            secretStream.on('open', () => resolve(false))
          })
        ).to.equal('Could not connect to peer')
      })
    })

    describe('server.close()', () => {
      it('should close the server and keep the node running', async () => {
        const node = await createNode({ keyPair })
        const server = node.createServer()
        await server.listen()

        expect(server.closed).to.be.false()
        expect(node.destroyed).to.be.false()

        await server.close()

        expect(server.closed).to.be.true()
        expect(node.destroyed).to.be.false()

        await node.destroy()
        expect(node.destroyed).to.be.true()
      })
    })

    describe('server.listen()', () => {
      it('should listen on the same keyPair as node.defaultKeypair', async () => {
        const node1 = await createNode()

        const server = node1.createServer((secretStream) => {
          secretStream.on('data', (data) =>
            expect(data).to.eql(b4a.from('hello'))
          )
        })

        await server.listen()

        expect(server.publicKey).to.eql(node1.defaultKeyPair.publicKey)

        const node2 = await createNode()
        const secretStream = node2.connect(server.publicKey)
        expect(
          await new Promise((resolve, reject) => {
            secretStream.on('error', (error) => reject(error))
            secretStream.on('open', () => {
              secretStream.write('hello')
              resolve(true)
            })
          })
        ).to.be.true()
      })

      it('should listen on another keyPair than the node.defaultKeypair', async () => {
        const node1 = await createNode({ keyPair })

        const server = node1.createServer((secretStream) => {
          secretStream.on('data', (data) =>
            expect(data).to.eql(b4a.from('hello'))
          )
        })

        const customKeyPair = crypto.keyPair(b4a.from('f'.repeat(64), 'hex'))

        await server.listen(customKeyPair)

        expect(server.publicKey).to.eql(customKeyPair.publicKey)
        expect(server.publicKey).to.not.eql(node1.defaultKeyPair.publicKey)

        const node2 = await createNode()
        const secretStream = node2.connect(server.publicKey)

        expect(
          await new Promise((resolve, reject) => {
            secretStream.on('error', (error) => reject(error))
            secretStream.on('open', () => {
              secretStream.write('hello')
              resolve(true)
            })
          })
        ).to.be.true()
      })
    })

    describe('server.on()', () => {
      it('should emit event "connection"', async () => {
        const node1 = await createNode()

        const server = node1.createServer((secretStream) => {
          secretStream.on('data', (data) =>
            expect(data).to.eql(b4a.from('hello'))
          )
        })

        await server.listen()

        expect(server.publicKey).to.eql(node1.defaultKeyPair.publicKey)

        const node2 = await createNode()
        const secretStream = node2.connect(server.publicKey)

        expect(
          await new Promise((resolve, reject) => {
            secretStream.on('error', (error) => reject(error))
            secretStream.on('open', () => {
              secretStream.write('hello')
              resolve(true)
            })
          })
        ).to.be.true()
      })

      it('should emit event "listening"', async () => {
        const node1 = await createNode()

        const server = node1.createServer()

        server.listen()

        const listening = await new Promise((resolve, reject) => {
          server.on('listening', () => {
            resolve(true)
          })
        })

        expect(listening).to.be.true()
      })

      it('should emit event "close"', async () => {
        const node1 = await createNode()

        const server = node1.createServer()
        await server.listen()

        const closing = await new Promise((resolve, reject) => {
          server.on('close', () => resolve(true))
          server.close()
        })

        expect(closing).to.be.true()
      })
    })

    describe('server.address()', () => {
      it('should return correct address interface', async () => {
        const node1 = await createNode({ keyPair })
        const server = node1.createServer()
        await server.listen()

        const address = server.address()

        expect(typeof address.host).to.equal('string')
        expect(typeof address.port).to.equal('number')
        expect(address.publicKey).to.eql(keyPair.publicKey)
      })
    })

    describe('server.publicKey', () => {
      it("should return the server's publicKey", async () => {
        const node1 = await createNode({ keyPair })
        const server = node1.createServer()
        await server.listen()

        expect(server.publicKey).to.equal(keyPair.publicKey)
      })
    })
  })

  describe('Connecting to P2P servers', () => {
    after(cleanNodes)

    it('connect to a remote server', async () => {
      const node = await createNode()

      const encryptedConnection = node.connect(DHT_KEY)

      encryptedConnection.on('error', (error) => {
        throw error
      })

      await new Promise((resolve) => {
        encryptedConnection.on('open', () => {
          expect(encryptedConnection.remotePublicKey).to.eql(DHT_KEY)
          expect(encryptedConnection.publicKey).to.eql(
            node.defaultKeyPair.publicKey
          )

          encryptedConnection.on('data', (data) => {
            expect(data).to.eql(b4a.from('hello'))
            resolve()
          })
        })
      })
    })

    it('connect to a remote server with a custom keyPair', async () => {
      const node = await createNode()

      const customKeyPair = crypto.keyPair(b4a.from('f'.repeat(64), 'hex'))

      const encryptedConnection = node.connect(DHT_KEY, {
        keyPair: customKeyPair
      })

      encryptedConnection.on('error', (error) => {
        throw error
      })

      await new Promise((resolve) => {
        encryptedConnection.on('open', () => {
          expect(encryptedConnection.remotePublicKey).to.eql(DHT_KEY)
          expect(encryptedConnection.publicKey).to.eql(customKeyPair.publicKey)
          expect(encryptedConnection.publicKey).to.not.eql(
            node.defaultKeyPair.publicKey
          )

          encryptedConnection.on('data', (data) => {
            expect(data).to.eql(b4a.from('hello'))
            resolve()
          })
        })
      })
    })
  })

  describe.skip('Additional peer discovery', () => {
    after(cleanNodes)

    async function toArray (iterable) {
      const result = []
      for await (const data of iterable) result.push(data)
      return result
    }

    describe('lookup(topic)', () => {
      it('should lookup a topic and return a stream with closestNodes', async () => {
        const node = await createNode()

        const stream = node.lookup(topic)

        await stream.finished()

        expect(stream.closestNodes.length).to.be.at.least(1)
        expect(stream.closestNodes[0].id).to.not.be.undefined()
        expect(typeof stream.closestNodes[0].host).to.equal('string')
        expect(typeof stream.closestNodes[0].port).to.equal('number')
      })

      it('should lookup a topic and return an iterable stream', async () => {
        const node = await createNode()

        const stream = node.lookup(topic)

        const result = await toArray(stream)

        expect(result.length).to.be.at.least(1)
        expect(result[0].peers.length).to.be.at.least(1)
        expect(result[0].peers[0].publicKey).to.eql(DHT_KEY)
      })
    })

    describe('announce(topic, keyPair)', () => {
      it('should announce a topic using a keyPair', async () => {
        const node1 = await createNode()
        const node2 = await createNode()

        const topic = b4a.from(
          '00000000e64b5491722088d9a0d741628fc826e09475d341a780acde3c4b8070',
          'hex'
        )

        await node1.announce(topic, node1.defaultKeyPair).finished()

        const stream = node2.lookup(topic)

        const result = await toArray(stream)

        expect(result.length).to.be.at.least(1)
        expect(result[0].peers.length).to.be.at.least(1)
        expect(
          result[0].peers.map((p) => p.publicKey.toString('hex'))
        ).to.includes(node1.defaultKeyPair.publicKey.toString('hex'))
      })
    })
  })

  describe.skip('relay', () => {
    after(cleanNodes)

    it('should throw an error if non of the relays worked', async () => {
      let error
      try {
        const node = new DHT({ relay: INVALID_RELAY_SERVER })
        await node.ready()
      } catch (_err) {
        error = _err
      }

      expect(error.message).to.eql('test')
    })
  })
}
