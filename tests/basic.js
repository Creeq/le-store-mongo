'use strict';

var PromiseA = require('bluebird');
var leStore = PromiseA.promisifyAll(require('../src').create);
leStore({
  debug: true
}, function(err, options) {
  leStore.accounts = PromiseA.promisifyAll(options.accounts);
  leStore.certificates = PromiseA.promisifyAll(options.certificates);

  // fixtures
  var doesntExist = {
    email: 'e@gmail.co'
  , accountId: 'eee'
  };
  var goodGuy = {
    email: 'goodguy@gmail.com'
  , keypair: {
      privateKeyPem: 'PRIVKEY.PEM', privateKeyJwk: { e: 'EXPO', n: 'MODULO' }
    , publicKeyPem: 'PUBKEY.PEM'/*, publicKeyJwk: would be reduntdant */
    }
  };

  var tests = [

    //
    // SANITY CHECKS
    //

    // SANITY test that an unregistered email returns no results
    function () {
      return leStore.accounts.checkKeypairAsync({
        email: doesntExist.email
      }).then(function (keypair) {
        if (null !== keypair) {
          throw new Error("Should return `null` when keypair does not exist by `email`.");
        }
      });
    }

    // SANITY test that an unregistered account id returns no results
  , function () {
      return leStore.accounts.checkAsync({
        accountId: doesntExist.accountId
      }).then(function (account) {
        if (null !== account) {
          throw new Error("Should return `null` when account does not exist by `accountId`.");
        }
      });
    }

    // SANITY test that an unregistered email returns no results
  , function () {
      return leStore.accounts.checkAsync({
        email: doesntExist.email
      }).then(function (account) {
        if (null !== account) {
          throw new Error("Should return `null` when account does not exist by `accountId`.");
        }
      });
    }

    //
    // Creating Account Keypairs
    //

    // Register a private key to an email
    // and make sure agreeTos remains falsey
  , function (cb) {
      return leStore.accounts.setKeypairAsync(goodGuy, goodGuy.keypair).then(function(keypair) {
        if (!keypair) {
          throw new Error("should set keypair")
        };
      });
    }

    // Fetch previous stored
  , function () {
      return leStore.accounts.checkKeypairAsync({
        email: goodGuy.email
      }).then(function (keypair) {

        if (!keypair) {
          throw new Error("should return saved keypair");
        }

        if (goodGuy.keypair.privateKeyPem !== keypair.privateKeyPem) {
          if (keypair.privateKeyJwk) {
            throw new Error("Error in test itself (not your fault). TODO: implement checking privateKeyJwk.");
          }
          //throw new Error("agreeTos should return false or null because it was not set.");
        }
      });
    }

    //
    // Creating Accounts
    //

    // create a new account
  , function () {
      var account = {
        receipt: {}
      , agreeTos: true
      };

      return leStore.accounts.setAsync(goodGuy, account).then(function (account) {
        account = account.value;
        if (!account || !account._id || !account.email) {
          throw new Error('accounts.set should return the object with its new `id` attached');
        }

        goodGuy.accountId = account._id;
      });
    }

    // get by account id
  , function () {
      return leStore.accounts.checkAsync({
        _id: goodGuy.accountId
      }).then(function (account) {
        if (!account) {
          throw new Error("Did not find account.");
        }
        else if (!account.keypair) {
          throw new Error("Account did not have a keypair.");
        }
        else if (goodGuy.keypair.privateKeyPem !== account.keypair.privateKeyPem) {
          if (account.keypair.privateKeyJwk) {
            throw new Error("Error in test itself (not your fault). TODO: implement checking privateKeyJwk.");
          }
          throw new Error("agreeTos should return false or null because it was not set.");
        }

        if (!account.email) {
          throw new Error("should have returned email");
        }

        if (!account.agreeTos) {
          throw new Error("should have returned agreeTos");
        }

        if (!account.receipt) {
          throw new Error("should have returned receipt");
        }
      });
    }
    // get by email
  , function () {
      return leStore.accounts.checkAsync({
        email: goodGuy.email
      }).then(function (account) {

        if (goodGuy.keypair.privateKeyPem !== account.keypair.privateKeyPem) {
          if (account.keypair.privateKeyJwk) {
            throw new Error("Error in test itself (not your fault). TODO: implement checking privateKeyJwk.");
          }
          throw new Error("agreeTos should return false or null because it was not set.");
        }

        if (!account.email) {
          throw new Error("should have returned email");
        }

        if (!account.agreeTos) {
          throw new Error("should have returned agreeTos");
        }

        if (!account.receipt) {
          throw new Error("should have returned receipt");
        }
      });
    }

    // Test that id and accountId are ignored
    // and that arbitrary keys are stored
  , function () {
      var rnd = require('crypto').randomBytes(8).toString('hex');
      var opts = {
        accountId: '_account_id'
      , id: '__account_id'
      , email: 'john.doe@gmail.com'
      , agreeTos: 'TOS_URL'
      };
      var account = {
        keypair: { privateKeyJwk: {}, privateKeyPem: 'PEM2', publicKeyPem: 'PUBPEM2'  }
      , receipt: {}
      };
      account[rnd] = rnd;
      return leStore.accounts.setKeypairAsync(opts, account.keypair).then(function () {
        return leStore.accounts.setAsync(opts, account).then(function (account) {
          account = account.value;

          if ('_account_id' === account._id) {
            throw new Error("Should create `id` deterministically from email or public key, not the given `accountId` or `id`.");
          }

          if ('john.doe@gmail.com' !== account.email) {
            throw new Error("Should return the same email that was stored.");
          }

          if ('TOS_URL' !== account.agreeTos) {
            throw new Error("Should return the same string for the tosUrl in agreeTos as was stored.");
          }

          if ('PEM2' !== account.keypair.privateKeyPem) {
            throw new Error("Should return the same privateKey that was stored.");
          }

          if (rnd !== account[rnd]) {
            throw new Error("Should save and restore arbitrary keys.");
          }
        });
      });
    }

    // test lots of stuff
  , function () {
      return leStore.accounts.checkAsync({
        _id: goodGuy.accountId
      }).then(function (account) {
        if (!account
            || !account.agreeTos
            || account.email !== goodGuy.email
            || goodGuy.keypair.privateKeyPem !== account.keypair.privateKeyPem
            ) {
          throw new Error("Should return the same account that was saved when retrieved using `accountId`.");
        }
      });
    }
  , function () {
      return leStore.accounts.checkAsync({
        email: goodGuy.email
      }).then(function (account) {
        if (!account
            || !account.agreeTos
            || account.email !== goodGuy.email
            || goodGuy.keypair.privateKeyPem !== account.keypair.privateKeyPem
            ) {
          throw new Error("Should return the same account that was saved when retrieved using `accountId`.");
        }
      });
    },

    /**
     * Save a certificate - setup 
     */
    function () {
      var certOpts = {
        domains: [ 'example.com', 'www.example.com', 'foo.net', 'bar.foo.net' ]
      , email: goodGuy.email
      , certs: {
          cert: 'CERT_A.PEM'
        , privkey: 'PRIVKEY_A.PEM'
        , chain: 'CHAIN_A.PEM'
        },
      };

      leStore.certificates.setAsync(certOpts, certOpts.certs)
      return Promise.resolve(true)
    }
    // and another - setup
  , function () {
      var certOpts = {
        domains: [ 'foo.com', 'www.foo.com', 'baz.net', 'bar.baz.net' ]
      , _id: goodGuy.accountId
      , certs: {
          cert: 'CERT_B.PEM'
        , privkey: 'PRIVKEY_B.PEM'
        , chain: 'CHAIN_B.PEM'
        }
      };

      leStore.certificates.setAsync(certOpts, certOpts.certs);
      return Promise.resolve(true)
    }

    // basic test (set by email)
  , function () {
      var query = {
        email: goodGuy.email
      };
      leStore.certificates.checkAsync(query).then(function (certs) {
        if (!certs || certs.privkey !== 'PRIVKEY_A.PEM') {
          throw new Error("should have correct certs for goodguy@gmail.com (set by email)");
        }
      });
      return Promise.resolve()
    }
    // basic test (set by accountId)
  , function () {
      var query = {
        _id: goodGuy.accountId
      };
      leStore.certificates.checkAsync(query).then(function (certs) {
        if (!certs || certs.privkey !== 'PRIVKEY_B.PEM') {
          throw new Error("should have correct certs for example.com (set by email)");
        }
      });
      return Promise.resolve()
    }
    // altnames test
  , function () {
      var certOpts = {
        domains: [ 'bar.foo.net' ]
      };
      leStore.certificates.checkAsync(certOpts).then(function (certs) {
        if (!certs || certs.privkey !== 'PRIVKEY_A.PEM') {
          throw new Error("should have correct certs for bar.foo.net (one of the example.com altnames)");
        }
      });
      return Promise.resolve()
    }
    // altnames test
  , function () {
      var certOpts = {
        domains: [ 'baz.net' ]
      };
      leStore.certificates.checkAsync(certOpts).then(function (certs) {
        if (!certs || certs.privkey !== 'PRIVKEY_B.PEM') {
          throw new Error("should have correct certs for baz.net (one of the foo.com altnames)");
        }
      });
      return Promise.resolve()
    }
  ];

  var arr = tests.slice(0);

  function run() {
    var test = tests.shift();
    if (!test) {
      console.info('All tests passed');
      process.exit(0);
    }

    test().then(run, function (err) {
      if (err) {
        var index = arr.length - tests.length;
        console.error('Failed Test #' + index);
        console.log(`${test}`)
        console.log(err);
        process.exit(1);
      };
      console.log(`Test ${index} passed`)
    });
  }

  run();
})
