const async = require('async');
const glob = require('glob');
const Storj = require('storj');
const path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');

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

  if(bucketName === undefined) {
    return handleError(new Error('BUCKET_NAME required'));
  }
}

/**************
 * Main Logic *
 **************/

validateInput();

let storj = new Storj(opts);
storj.on('ready', function(e) {
  if(e) {
    return handleError(e);
  }
  // Start waterfall below
  getBucketId();
});

/*********************
 * Hoist async logic *
 *********************/

function getBucketId() {
  // Only create a bucket if one doesn't already exist
  storj.getBuckets(function(e, buckets) {
    if(e) {
      return handleError(e);
    }

    for(var i = 0; i < buckets.length; i++) {
      if(buckets[i].name === bucketName) {
        result.bucketId = buckets[i].id;
        break;
      }
    }

    if(result.bucketId === undefined) {
      return handleError('Did not find bucket');
    }

    getFiles()
  });
}

function getFiles() {
  glob('files/*/*.pdf', function(e, files) {
    if(e) {
      return handleError(e);
    }

    result.files = files.map((v) => ({
      path: v,
      name: path.parse(v).base
    }));

    getBucketContents();
  })
}

function getBucketContents() {
  storj.getBucket(result.bucketId, function(e, bucket) {
    if(e) {
      return handleError(e);
    }

    for(var i = 0; i < bucket.files.length; i++) {
      for(var j = 0; j < result.files.length; j++) {
        if(bucket.files[i].filename === result.files[j].name) {
          result.files[j].id = bucket.files[i].id;
        }
      }
    }
    uploadFiles();
  });
}

function uploadFiles() {
  async.eachLimit(result.files, 5, uploadFile, function(e) {
    if(e) {
      return handleError(e);
    }

    console.log('Saving info to bucket.json....');
    mkdirp('./_data', function(e) {
      if(e) {
        return handleError(e);
      }
      fs.writeFileSync('./_data/bucket.json', JSON.stringify(result));
    });
    console.log('DONE!');
  });
}

function uploadFile(file, cb) {
  if(file.id !== undefined) {
    console.log(`${file.name} already in bucket, skipping!`);
    return cb();
  }

  var rs = fs.createReadStream(file.path);

  console.log(`${file.name}: Uploading...`);
  var f = storj.createFile(result.bucketId, file.name, rs);
  f.on('error', function(e) {
    var c = cb;
    cb = function noop() {}
    console.error(`${file.name} Failed to upload`);
    console.error(e);
    return c();
  });
  f.on('done', function(resp) {
    file.id = resp.id;
    return cb();
  });
}
