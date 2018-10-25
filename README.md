# le-store-mongo
An implementation of le-store-SPEC for mongo for storing and retrieving TLS certificate private keys and related account metadata

The default for this module is to connect to a local mongo with no credentials and store values in a database named greenlock. 

The collections are named accounts and certificates.

To override these, see the configuration section below.

## Configuration
To override the defaults, provide the following settings

```javascript
{
  url: 'mongo connection url (see below)',
  dbName: 'the database name to use (defaults to "greenlock"),
  mmongo: 'Mongo driver options - defaults below',
  certsCollName: 'The name of the collection to store certificates in, certificates by default',
  accountsCollName: "Name of accounts collection, accounts by default.'
}
```

Connection url takes the form `{protocol}://{username}:{password}@{mongo_server_url}`

The installed driver will support both mongodb:// and mongodb+srv:// connections (the latter is a dns based strategy for clustering/sharding). If you are overriding mongo options and n order for mongodb+srv to work, you need to pass {useNewUrlParser: true} into mongoOptions

If you want to embed the greenlock data in your own database, that's fine. It stores the certificates, emails and accounts in the following collections

- certificates
- accounts

API
===

```
* getOptions()
* accounts.
  * checkKeypair(opts, cb)
  * setKeypair(opts, keypair, cb)
  * check(opts, cb)
  * set(opts, reg, cb)
* certificates.
  * checkKeypair(opts, cb)
  * setKeypair(opts, keypair, cb)
  * check(opts, cb)
  * set(opts, certs, cb)
```

Keypairs
--------

For convenience, the keypair object will always contain **both** PEM and JWK
versions of the private and/or public keys when being passed to the `*Keypair` functions.

**set**

`setKeypair` will always be called with `email` and **all three** forms of the keypair:
`privateKeyPem`, `publicKeyPem`, and `privateKeyJwk`. It's easy to generate `publicKeyJwk`
from `privateKeyJwk` because it is just a copy of the public fields `e` and `n`.

```
// keypair looks like this
{ privateKeyPem: '...'
, publicKeyPem: '...'
, privateKeyJwk: { ... }
}
```

**check**

`checkKeypair` may be called with any of `email`, `accountId`, and `keypair` - which will
contain only `publicKeyPem` and `publicKeyJwk`.

```
// opts looks like this
{
  email: '...@...'
, accountId: '...'
, keypair: {
    publicKeyPem: '...'
  , publicKeyJwk: { ... }
  }
}
```

# Data housekeeping
This module does not clear out old certificates. You can either implement this yourself as a cron-job, or create managed collections which will self-housekeep on a FIFO basis.