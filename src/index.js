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

const MongoStore = require('./mongostore');
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
   * @param {Object} opts The query options, as describe above
   * @param {Object} opts The query options, as describe above
   * @param {Object} opts The query options, as describe above
   * @param {Function} cb - cb()
   */
  checkKeypair: function (opts, cb) {
    was.db && was.db.getAccount(opts, cb);
  }, 
  /**
   * Save cert keypairs to db (as PEM and/or JWK)
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
    /*
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
   * SAVE certificate keypairs to db
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
  check: async (query, cb) => {
  /**
   * Return certificates from db if it exists, otherwise null
   *
   * Valid option values for query include:
   *  - `query.email`, the email of query
   *  - `query.accountId`, the accountId of query
   *  - `query.domains`, query by domains
   *  - return certificate keys from db if they exist, otherwise null
   *  - optionally include expiresAt and issuedAt, if they are known exactly
   *  - (otherwise they will be read from the cert itself later)
   *
   * @api public
   * @param {Object} opts The query options, as describe above
   * @param {Function} cb The callback that will be called
   *                        when the operation is complete
   */
    if(!was.db) return cb(null)
    var certificate = await was.db.getCertificate(query);
    cb(certificate)
  }, 
  set: async (query, certs, cb) => {
  /**
   * Save certificates to the store
   *
   * Valid options include:
   *  - `opts.accountId`, the accountId of query
   *  - SAVE to the database, index the email address, the accountId, and alias the domains
   *
   * @api public
   * @param {Object} query         The certificate details:
   * @param {Object} query.certs     certificate keys including public and private pem and private jwk 
   * @param {Object} query.domains   array of associated domains
   * @param {Object} query.email     email address for cert expiry notifications (optional in ACME but required in greenlock)   * 
   * @param {Function} cb The callback that will be called
   *                        when the operation is complete
   */
    
    if(!was.db) return cb(null)
    var result = await was.db.setCertificate(query, {certs: certs});
    return cb(result)
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
function leStore(options) {
  return {
    getOptions: function () {
      return options;
    }, 
    accounts: was.accounts, 
    certificates: was.certificates
  };
}

const connect = async function(options) {
  return await MongoStore(options)
}

/**
 * Create MongoStore, exposes API
 *
 * Valid options include:
 *  - `options`, the db options
 *  - options merged with default settings via MongoStore
 *
 * @api public
 * @param {Object} options The db options
 * @param {Function} cb The callback that will be called
 *                        when the operation is complete
 */
module.exports.create = async function (options, cb) {

  if (!was.db) {
    try {
      was.db = await connect(options)
      console.log(was.db)      
    } catch (err) {
      was.err = {
        code: 500,
        message: `no database created ${err}`
      }
    }
  }
  const store = leStore(options)
  return cb ? cb(was.err, store) : store;
}
