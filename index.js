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

var MongoStore = require('./src/mongostore');
var was = {};


was.accounts = {
  /**
   * Check db and return null or keypair object with one of privateKeyPem or privateKeyJwk
   *
   * Valid option values for query include:
   *  - `opts.email`, the email of query
   *  - `opts.accountId`, the accountId of query
   *
   * @api public
   * @param {Object} opts The query options, as describe above
   * @param {Function} cb The callback that will be called
   *                        when the operation is complete
   */
  checkKeypair: function (opts, cb) {
    was.db && was.db.getAccount(opts, cb);
  }, 
  /**
   * SAVE to db (as PEM and/or JWK) and index each domain in domains to this keypair
   *
   * Valid options include:
   *  - `opts.email`, the email of query
   *  - `opts.accountId`, the accountId of query
   *  - `keypair`, the key value objects to replace
   *
   * @api public
   * @param {Object} opts The query options, as describe above
   * @param {Object} keypair The keypair update values
   * @param {Function} cb The callback that will be called
   *                        when the operation is complete
   */
  setKeypair: function (opts, keypair, cb) {
    was.db && was.db.setAccount(opts, {keypair:keypair}, cb);
  }, 
  /**
   * Return account from db if it exists, otherwise null
   *
   * Valid option values for query include:
   *  - `opts.email`, the email of query
   *  - `opts.accountId`, the accountId of query
   *  - `opts.domains`, query by domains
   *
   * @api public
   * @param {Object} opts The query options, as describe above
   * @param {Function} cb The callback that will be called
   *                        when the operation is complete
   */
  check: function (opts, cb) {
    was.db && was.db.getAccount(opts, cb);
  }, 
  set: function (opts, reg, cb) {
  /**
   * Set keypair or receipts
   *
   * Valid options include:
   *  - `opts.email`, the email of query
   *  - `opts.accountId`, the accountId of query
   *  - `opts.domains`, query by domains
   *  - `reg.keypair`, values to set
   *  - `reg.receipt`, values to set
   *
   * @api public
   * @param {Object} opts The query options, as describe above
   * @param {Object} reg The setter values
   * @param {Function} cb The callback that will be called
   *                        when the operation is complete
   */
    was.db && was.db.setAccount(opts, reg, cb);
  }
}

was.certificates = {
  checkKeypair: function (opts, cb) {
  /**
   * Check db and return null or keypair object with one of privateKeyPem or privateKeyJwk
   *
   * Valid option values for query include:
   *  - `opts.email`, the email of query
   *  - `opts.accountId`, the accountId of query
   *
   * @api public
   * @param {Object} opts The query options, as describe above
   * @param {Function} cb The callback that will be called
   *                        when the operation is complete
   */
    was.db && was.db.getCertificate(opts, cb);
  }, 
  setKeypair: function (opts, keypair, cb) {
  /**
   * SAVE certificates to db
   *
   * Valid options include:
   *  - `opts.email`, the email of query
   *  - `opts.accountId`, the accountId of query
   *  - `keypair`, the key value objects to replace
   *
   * @api public
   * @param {Object} opts The query options, as describe above
   * @param {Object} keypair The keypair update values
   * @param {Function} cb The callback that will be called
   *                        when the operation is complete
   */
    was.db && was.db.setCertificate(opts, {keypair:keypair}, cb);
  }, 
  check: function (opts, cb) {
  /**
   * Return certificates from db if it exists, otherwise null
   *
   * Valid option values for query include:
   *  - `opts.email`, the email of query
   *  - `opts.accountId`, the accountId of query
   *  - `opts.domains`, query by domains
   *  - return certificate PEMs from db if they exist, otherwise null
   *  - optionally include expiresAt and issuedAt, if they are known exactly
   *  - (otherwise they will be read from the cert itself later)
   *
   * @api public
   * @param {Object} opts The query options, as describe above
   * @param {Function} cb The callback that will be called
   *                        when the operation is complete
   */
    was.db && was.db.getCertificate(opts, cb);
  }, 
  set: function (opts, pems, cb) {
  /**
   * Set certificates
   *
   * Valid options include:
   *  - `opts.email`, the email of query
   *  - `opts.accountId`, the accountId of query
   *  - `opts.domains`, query by domains
   *  - `pems.privkey`, setter values
   *  - `pems.cert`, setter values
   *  - `pems.chain`, setter values
   *  - SAVE to the database, index the email address, the accountId, and alias the domains
   *
   * @api public
   * @param {Object} opts The query options, as describe above
   * @param {Object} pems The setter values
   * @param {Function} cb The callback that will be called
   *                        when the operation is complete
   */
    was.db && was.db.setCertificate(opts, pems, cb);
  }
}

/**
 * Returns formatted options
 *
 * Valid options include:
 *  - `options`, the db options
 *  - options merged with default settings via MongoStore
 *
 * @api private
 * @param {Object} options The db options
 */
function formattedOptions(options) {
  return {
    getOptions: function () {
      return options;
    }, 
    accounts: was.accounts, 
    certificates: was.certificates
  };
}

/**
 * Create MongoStore
 *
 * Valid options include:
 *  - `options`, the db options
 *  - options merged with default settings via MongoStore
 *
 * @api private
 * @param {Object} options The db options
 * @param {Function} cb The callback that will be called
 *                        when the operation is complete
 */
module.exports.create = function(options, cb) {
  if (was.db) {
    cb(null, formattedOptions(options));
  } else {
    new MongoStore(options, function(err, db) {
      if (err || !db) was.err = {
        code: 500,
        message: 'no database created'
      }
      else was.db = db;
      cb(was.err, formattedOptions(options));
    });
  }
}
