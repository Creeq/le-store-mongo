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
 * @param {Function} done The callback that will be called
 *                        when the persistance is ready
 */
function MongoStore(options, done) {
  if (!(this instanceof MongoStore)) {
    return new MongoStore(options, done);
  }

  var was = this;

  var connected = function(err, db) {
    if (err) {
      if (done) {
        return done(err);
      }
      // we have no way of providing an error handler
      throw err;
    }

    was.db = db;
    steed.parallel([
      function(cb) {
        db.collection("certificates", function(err, coll) {
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
        db.collection("accounts", function(err, coll) {
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
      if (done) {
        done(err, was);
      }
    });
  };

  // Connect to the db
  if (options.connection) {
    connected(null, this.options.connection);
  } else {
    MongoClient.connect(this.options.url, this.options.mongo, connected);
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
 * @param {Function} done   MongoDB callback
 */
MongoStore.prototype.setCertificate = function(query, options, done) {
  this._certificates.findAndModify(query, {
    $set: options
  }, { upsert: true}, done);
};

/**
 * Getter Certificates
 *
 * The current options include:
 *  - `query`, query values
 *
 * @api public
 * @param {Object} query  The query as describe above.
 * @param {Function} done MongoDB callback
 */
MongoStore.prototype.getCertificate = function(query, done) {
  this._certificates.findOne(query, done);
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
 * @param {Function} done   MongoDB callback
 */
MongoStore.prototype.setAccount = function(query, options, done) {
  this._accounts.findAndModify(query, {
    $set: options
  }, { upsert: true}, done);
};

/**
 * Getter Accounts
 *
 * The current options include:
 *  - `query`, query values
 *
 * @api public
 * @param {Object} query  The query as describe above.
 * @param {Function} done MongoDB callback
 */
MongoStore.prototype.getAccount = function(query, done) {
  this._accounts.findOne(query, done);
};

/**
 * Close database
 *
 * @api public
 * @param {Function} done Callback on finish
 */
MongoStore.prototype.close = function(done) {
  if (this.db) {
    this.db.close(done);
  } else {
    done();
  }
};

/**
 * Export it as a module
 *
 * @api public
 */
module.exports = MongoStore;