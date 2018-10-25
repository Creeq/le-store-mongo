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
 * MongoDB backed certificate store for greenlock
 * 
 * Defaults to locally hosted
 * mongodb instance with no username and password
 *
 * @api public
 * @param {Object} options - client options:
 * @param {String} options.url - the connection URL for the database
 * @param {Object} mongo options object for the mongo driver
 * @param {Object} connection a MongoDB client object to be reused
 */
const MongoStore = async options => {
  const store = {
  }

  /**
   * Ensure that mongo indexes are created to track document ids, 
   * certificate keys, certificate related domains, and 
   * registration emails
   * 
   * Call back when the mongo connection has been established
   * 
   * @param {String} err - if error occurred connecting, contains reason
   * @param {Object} db - mongo driver database object
   */
  const connected = async dclient => {
    store.client = dclient
    store.db = store.client.db(options.dbName)

    try {
      await steed.parallel([
        async () => {
          store._certificates = await store.db.collection(options.certsCollName)
          await steed.parallel([
            async () => store._certificates.createIndex("privkey", {background: true}),
            async () => store._certificates.createIndex("cert", {background: true}),
            async () => store._certificates.createIndex("domains", {background: true}),
            async () => store._certificates.createIndex("email", {background: true}),
            async () => store._certificates.createIndex("accountId", {background: true}),
          ]);
        },
        async () => {
          store._accounts = await store.db.collection(options.accountsCollName)
          await steed.parallel([
            async () => store._accounts.createIndex( "privkey", {background: true}),
            async () => store._accounts.createIndex( "cert", {background: true}),
            async () => store._accounts.createIndex( "domains", {background: true}),
            async () => store._accounts.createIndex( "email", {background: true}),
            async () => store._accounts.createIndex( "accountId", {background: true}),
          ]);
        }
      ]);
    } catch (reason) {
      console.log(reason)
      throw reason
    }
  };

  // Connect to the db if connection not provided
  if (options.client) {
    connected(options.client);
  } else {
    options.url = options.url || 'mongodb://localhost:27017/greenlock';
    options.dbName = options.dbName || 'greenlock'
    options.certsCollName = options.certsCollName || 'certificates'
    options.accountsCollName = options.accountsCollName || 'accounts'
    options.mongo = options.mongo || 
    {
      "connectTimeoutMS": 1000,
      "keepAlive": 1,
      "autoReconnect": true,
      "useNewUrlParser": true
    }
    
    connected(await MongoClient.connect(options.url, options.mongo));
  }

  console.log('Returning store')
  return {
    getAccount: getAccount(store),
    setAccount: setAccount(store),
    getCertificate: getCertificate(store),
    setCertificate: setCertificate(store),
    close: close(store)
  }
}

/**
 * Update or insert new certificate document and return the
 * updated document
 *
 * @api public
 * @param {Object} query    the mongo query object
 * @param {Object} options  fields to set
 * @param {Function} cb     callback with result (null if not found)
 */
const setCertificate = store => async function (query, certs) {

  // mongo cli uses returnNewDocument: true but node native driver uses returnOriginal: false! 
  return store._certificates.findOneAndUpdate(query, {$set: certs, $setOnInsert:  {created: new Date()}}, 
    {upsert: true, returnNewDocument:true, returnOriginal: false});
};

/**
 * Get one certificate document by any of its fields
 *
 * @api public
 * @param {Object} query  mongo query object
 * @param {Function} cb   callback with result (null if not found)
 */
const getCertificate = store => async function(query) {
  query.domains && Array.isArray(query.domains) && (query.domains = {$in: query.domains})
  return store._certificates.findOne({});
};

/**
 * Update or insert account and return the modified document
 *
 * @api public
 * @param {Object} query    mongo query object
 * @param {Object} options  fields to update
 * @param {Function} cb     callback with result
 */
const setAccount = store => function(query, options, cb) {
  // mongo cli uses returnNewDocument: true but node native driver uses returnOriginal: false! 
  store._accounts.findOneAndUpdate(query, {$set: options, $setOnInsert:  {created: new Date()}}, {upsert: true, returnNewDocument:true, returnOriginal: false}, cb);
};

/**
 * Search for account by arbitrary fields
 *
 * @api public
 * @param {Object} query  The mongo query object
 * @param {Function} cb   callback with result (null if not found)
 */
const getAccount = store => async function(query, cb) {
  return await store._accounts.findOne(query, cb);
};

/**
 * Close database
 *
 * @api public
 * @param {Function} cb Callback on finish
 */
const close = store => async function() {
  if (store.db) {
    store.db.close(cb);
  }
};

/**
 * Export it as a module
 *
 * @api public
 */
module.exports = MongoStore;
