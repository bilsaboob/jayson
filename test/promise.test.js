'use strict';

const should = require('should');
const fetch = require('node-fetch');
const jayson = require('./../promise');
const jaysonPromise = require('./../promise');
const support = require('./support');
const jaysonPromiseBrowserClient = require('./../promise/lib/client/browser');

describe('jayson/promise', function() {

  describe('server', function() {

    const Server = jaysonPromise.Server;

    it('should return a correct instance without using "new"', function() {
      const instance = Server(function() {});
      instance.should.be.instanceof(Server);
      instance.should.be.instanceof(jayson.Server);
    });

    describe('instance', function() {

      let server = null;
      beforeEach(function() {
        server = new Server(support.server.methods(), support.server.options());
      });

      it('should make methods instance of Method', function() {
        server.method('add', function(args, done) { done(); });
        server.getMethod('add').should.be.instanceof(jaysonPromise.Method);
      });
    
    });
  
  });

  describe('client', function() {

    // auto-generated test-suite
    const suites = {

      regular: {
        server: function(done) {
          done();
          return new jaysonPromise.Server(support.server.methods(), support.server.options());
        },
        client: function(server) {
          return jaysonPromise.Client(server, support.server.options());
        }
      },

      http: {
        server: function(done) {
          const server = jaysonPromise.Server(support.server.methods(), support.server.options());
          const http = server.http();
          http.listen(3999, 'localhost', done);
          return http;
        },
        client: function(server) {
          return jaysonPromise.Client.http({
            reviver: support.server.options().reviver,
            replacer: support.server.options().replacer,
            host: 'localhost',
            port: 3999
          })
        },
        closeServer: function(http, done) {
          http.close(done);
        }
      },

      https: {
        server: function(done) {
          const server = jaysonPromise.Server(support.server.methods(), support.server.options());
          const https = server.https({
            ...support.server.keys(),
            keepAliveTimeout: 200,
          });
          https.listen(3999, 'localhost', done);
          return https;
        },
        client: function(server) {
          return jaysonPromise.Client.https({
            reviver: support.server.options().reviver,
            replacer: support.server.options().replacer,
            host: 'localhost',
            port: 3999,
            ca: support.server.keys().ca
          })
        },
        closeServer: function(https, done) {
          https.close(done);
        }
      },

      browser: {
        server: function(done) {
          const server = jaysonPromise.Server(support.server.methods(), support.server.options());
          const http = server.http();
          http.listen(3999, 'localhost', done);
          return http;
        },
        client: function(server) {
          return jaysonPromiseBrowserClient(function (request) {
            const options = {
              method: 'POST',
              body: request,
              headers: {
                'Content-Type': 'application/json',
              }
            };
            return fetch('http://localhost:3999', options)
              .then(function(res) { return res.text(); });
          }, {
            reviver: support.server.options().reviver,
            replacer: support.server.options().replacer,
            host: 'localhost',
            port: 3999
          });
        },
        closeServer: function(http, done) {
          http.close(done);
        }
      },

      tcp: {
        server: function(done) {
          const server = jaysonPromise.Server(support.server.methods(), support.server.options());
          const tcp = server.tcp();
          tcp.listen(3999, 'localhost', done);
          return tcp;
        },
        client: function(server) {
          return jaysonPromise.Client.tcp({
            reviver: support.server.options().reviver,
            replacer: support.server.options().replacer,
            host: 'localhost',
            port: 3999,
            ca: support.server.keys().ca
          })
        },
        closeServer: function(tcp, done) {
          tcp.close(done);
        }
      },

      tls: {
        server: function(done) {
          const server = jaysonPromise.Server(support.server.methods(), support.server.options());
          const tls = server.tls(support.server.keys());
          tls.listen(3999, 'localhost', done);
          return tls;
        },
        client: function(server) {
          return jaysonPromise.Client.tls({
            reviver: support.server.options().reviver,
            replacer: support.server.options().replacer,
            host: 'localhost',
            port: 3999,
            ca: support.server.keys().ca
          })
        },
        closeServer: function(tls, done) {
          tls.close(done);
        }
      },

      websocket: {
        server: function(done) {
          const server = jaysonPromise.Server(support.server.methods(), support.server.options());
          const wss = server.websocket({port: 3999});
          done();
          return wss;
        },
        client: function (server, done) {
          const websocket = jaysonPromise.Client.websocket({
            url: 'ws://localhost:3999',
          });
          websocket.ws.on('open', done);
          return websocket;
        },
        closeServer: function(wss, done) {
          wss.close();
          done();
        }
      }

    };

    Object.keys(suites).forEach(function(name) {
      const suite = suites[name];

      describe(name, function() {

        let server = null
        before(function(done) {
          server = suite.server(done);
        });

        let client = null;
        beforeEach(function(done) {
          if (suite.client.length === 2) {
            client = suite.client(server, done);
          } else {
            client = suite.client(server);
            done();
          }
        });

        if(suite.closeServer) {
          after(function(done) {
            suite.closeServer(server, done);
          });
        }

        describe('request', function() {

          it('should do a request and fulfill a promise', function () {
            return should(client.request('add', [333, 333])).be.fulfilled().catch(err => {
              console.log(err, err.stack);
            }).then(function(response) {
              should(response).containDeep({result: 666});
            });
          });

          it('should do a request and fulfill a promise that errored', function() {
            return should(client.request('error', [])).be.fulfilled().then(function(response) {
              should(response).containDeep({error: {code: -1000}});
            });
          });

          it('should return a raw request when fourth parameter is false', function() {
            const request = client.request('add', [1, 2], false, false);
            should(request).not.be.a.Promise();
            should(request.id).be.a.string;
            should(request.method).equal('add');
            should(request.params).eql([1,2]);
          });

          it('should accept an array of requests and make a batch', function() {
            const batch = [client.request('add', [1,2], undefined, false)];
            return should(client.request(batch)).be.fulfilled().then(function(responses) {
              should(responses).be.an.array;
              should(responses).have.lengthOf(1);
              should(responses[0]).have.property('result', 3);
            });
          });

        });
      
      });
    
    });
  
  });

  describe('method', function() {

    const Method = jaysonPromise.Method;

    it('should return an instance without using "new"', function() {
      Method(function() {}).should.be.instanceof(Method);
    });

    describe('instance', function() {

      let method = null, server = new jaysonPromise.Server();
      beforeEach(function() {
        method = new Method({});
      });

      describe('execute', function() {

        const handlers = {
          sum: function(args) {
            return new Promise(function(resolve, reject) {
              const sum = Object.keys(args).reduce((sum, key) => sum + args[key], 0);
              resolve(sum);
            });
          },
          error: function(args) {
            return new Promise(function(resolve, reject) {
              const code = args.code || -1;
              reject({code: code});
            })
          },
          // returns a "Promise-like" object
          thenable: function(args) {
            return {then: function(resolve, reject) {
              const sum = Object.keys(args).reduce((sum, key) => sum + args[key], 0);
              resolve(sum);
            }};
          }
        };

        it('should allow a promise to be returned and fulfilled by the handler', function(done) {
          method.setHandler(handlers.sum);
          method.execute(server, [1, 2, 3], function(err, response) {
            if(err) return done(err);
            response.should.equal(6);
            done();
          });
        });

        it('should allow a promise to be returned and rejected by the handler', function(done) {
          method.setHandler(handlers.error);
          method.execute(server, [], function(err, response) {
            err.should.containDeep({code: -1});
            done();
          });
        });

        it('should allow a "Promise-like" object to be returned and fulfilled by the handler', function(done) {
          method.setHandler(handlers.thenable);
          method.execute(server, [3, 4, 5], function(err, response) {
            if(err) return done(err);
            response.should.equal(12);
            done();
          });
        });

        it('should pass on a provided context object', function(done) {
          method.options.useContext = true;
          method.setHandler(function(args, context) {
            return new Promise(function(resolve) {
              resolve(context);
            });
          });
          method.execute(server, [1, 2, 3], {hello: true}, function(err, response) {
            if(err) return done(err);
            response.should.eql({hello: true});
            done();
          });
        
        });

      });
    
    });
  
  });

});
