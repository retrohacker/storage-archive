const async = require('async');
const glob = require('glob');
const Storj = require('storj');

const result = {}
const bucketName = process.env.BUCKET_NAME || 'storage-archive';
const opts = {
  bridge: process.env.BRIDGE_URL || 'https://api.storj.io',
  basicAuth: {
    email: process.env.STORJ_EMAIL,
    password: process.env.STORJ_PASSWORD
  }
}

/********************
 * Helper Functions *
 ********************/

function handleError(e) {
  console.error(e);
  process.exit(1);
}

function validateInput() {
  if(opts.basicAuth.password === undefined) {
    return handleError(new Error('STORJ_PASSWORD required'));
  }

  if(opts.basicAuth.email === undefined) {
    return handleError(new Error('STORJ_EMAIL required'));
  }
}

/**************
 * Main Logic *
 **************/

let storj = new Storj();
storj.on('ready', function(e) {
  if(e) {
    return handleError(e);
  }
  var keypair = storj.generateKeyPair();
  var pubkey = keypair.getPublicKey();
  storj.registerKey(pubkey, function(e) {
    console.log(arguments);
  });
});

/*********************
 * Hoist async logic *
 *********************/

function createBucket() {
  // Only create a bucket if one doesn't already exist
  storj.getBuckets(function(e, buckets) {
    if(e) {
      return handleError(e);
    }
    console.log(buckets);
  });
}

function getFiles() {
  glob('files/*/*.pdf', function(e, files) {
    if(e) {
      return handleError(e);
    }
  })
}

