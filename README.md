# storage-archive

[![Greenkeeper badge](https://badges.greenkeeper.io/retrohacker/storage-archive.svg)](https://greenkeeper.io/)
Collection of papers on untrusted distributed storage networks.

Copyright for each paper belongs to the original publisher.

### Building

This generates a static website that serves the PDFs in `files/` directly from the storj network.

To upload the files to storj, simply run:

```js
storj add-bucket storage-archive
// creates bucket 83b67934372902f0422c0ef7
storj generate-seed
storj make-public --pull 83b67934372902f0422c0ef7
STORJ_EMAIL=[username] STORJ_PASSWORD=[pass] npm run build
```

You can also supply `STORJ_BRIDGE=[http://bridge_ip:port]` if you want to use another bridge for the upload.

From here, jekyll takes over, all you need to do is upload to GitHub pages.

If you want to test it locally, simply run:

```
npm install -g local-web-server
jekyll build
cd _site
ws -p 8000
```

And the site will now be served from http://127.0.0.1:8000
