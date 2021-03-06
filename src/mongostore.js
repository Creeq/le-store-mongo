/*
The copyright notice and permission notice written shall be
included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
*/
"use strict";

var mongo = require('mongodb');
var MongoClient = mongo.MongoClient;
var steed = require("steed")();

/**
 * MongoDB certificate persistence.
 *
 * The current options include:
 *  - `url`, the connection URL of the database
 *  - `mongo`, all the options for the MongoDB driver.
 *  - `connection`, a MongoDB client to be reused
 *
 * @api public
 * @param {Object} options The options, as describe above.
 * @param {Function} cb The callback that will be called
 *                        when the persistance is ready
 */
function MongoStore(options, cb) {
  if (!(this instanceof MongoStore)) {
    return new MongoStore(options, cb);
  }

  var was = this;

  var connected = function(err, db) {
    if (err) {
      if (cb) {
        return cb(err);
      }
      // we have no way of providing an error handler
      throw err;
    }

    was.db = db;
    steed.parallel([
      function(cb) {
        was.db.collection("certificates", function(err, coll) {
          was._certificates = coll;
          steed.parallel([
            was._certificates.ensureIndex.bind(was._certificates, "privkey"),
            was._certificates.ensureIndex.bind(was._certificates, "cert"),
            was._certificates.ensureIndex.bind(was._certificates, "domains"),
            was._certificates.ensureIndex.bind(was._certificates, "email"),
            was._certificates.ensureIndex.bind(was._certificates, "accountId")
          ], cb);
        });
      },
      function(cb) {
        was.db.collection("accounts", function(err, coll) {
          was._accounts = coll;
          steed.parallel([
            was._accounts.ensureIndex.bind(was._accounts, "privkey"),
            was._accounts.ensureIndex.bind(was._accounts, "cert"),
            was._accounts.ensureIndex.bind(was._accounts, "domains"),
            was._accounts.ensureIndex.bind(was._accounts, "email"),
            was._accounts.ensureIndex.bind(was._accounts, "accountId")
          ], cb);
        });
      }
    ], function(err) {
      if (cb) {
        cb(err, was);
      }
    });
  };

  // Connect to the db
  if (options.connection) {
    connected(null, options.connection);
  } else {
    options.url = options.url || 'mongodb://localhost:27017/letsencrypt-node';
    options.mongo = options.mongo || {
                                                  "db": {
                                                      "native_parser": true
                                                  },
                                                  "server": {
                                                      "socketOptions": {
                                                          "connectTimeoutMS": 1000,
                                                          "keepAlive": 1
                                                      },
                                                      "auto_reconnect": true
                                                  },
                                                  "replset": {
                                                      "socketOptions": {
                                                          "keepAlive": 1,
                                                          "connectTimeoutMS": 1000
                                                      }
                                                  }
                                              }
    MongoClient.connect(options.url, options.mongo, connected);
  }
}

/**
 * Setter Certificates
 *
 * The current options include:
 *  - `query`,   query values if any
 *  - `options`, setter values
 *
 * @api public
 * @param {Object} query    The query as describe above.
 * @param {Object} options  The options as describe above.
 * @param {Function} cb   MongoDB callback
 */
MongoStore.prototype.setCertificate = function(query, options, cb) {
  this._certificates.findAndModify(query, {}, {
    $set: options
  }, {upsert: true, new:true}, cb);
};

/**
 * Getter Certificates
 *
 * The current options include:
 *  - `query`, query values
 *
 * @api public
 * @param {Object} query  The query as describe above.
 * @param {Function} cb MongoDB callback
 */
MongoStore.prototype.getCertificate = function(query, cb) {
  this._certificates.findOne(query, cb);
};

/**
 * Setter Accounts
 *
 * The current options include:
 *  - `query`,   query values if any
 *  - `options`, setter values
 *
 * @api public
 * @param {Object} query    The query as describe above.
 * @param {Object} options  The options as describe above.
 * @param {Function} cb   MongoDB callback
 */
MongoStore.prototype.setAccount = function(query, options, cb) {
  this._accounts.findAndModify(query, {}, {$set:options}, {upsert: true, new:true}, cb);
};

/**
 * Getter Accounts
 *
 * The current options include:
 *  - `query`, query values
 *
 * @api public
 * @param {Object} query  The query as describe above.
 * @param {Function} cb MongoDB callback
 */
MongoStore.prototype.getAccount = function(query, cb) {
  this._accounts.findOne(query, cb);
};

/**
 * Close database
 *
 * @api public
 * @param {Function} cb Callback on finish
 */
MongoStore.prototype.close = function(cb) {
  if (this.db) {
    this.db.close(cb);
  } else {
    cb();
  }
};

/**
 * Export it as a module
 *
 * @api public
 */
module.exports = MongoStore;