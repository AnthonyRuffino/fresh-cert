'use strict'
"use strict";

class FreshCert {
  constructor({
    router,
    sslKeyFile,
    sslDomainCertFile,
    sslCaBundleFile,
    enforceHttps = true
  }) {
    this.fs = require('fs');
    this.https = require('https');
    
    this.sslKeyFile = sslKeyFile;
    this.sslDomainCertFile = sslDomainCertFile;
    this.sslCaBundleFile = sslCaBundleFile;
    this.enforceHttps = enforceHttps;
    this.router = router;
  }

  getSecureServer() {
    const info = '[[FRESH-CERT]]   ';
    console.log(info + 'configuring SSL with fresh-cert...');
    console.log(info + 'https://github.com/AnthonyRuffino/fresh-cert');
    console.trace(info + 'sslKeyFile: ' + this.sslKeyFile);
    console.trace(info + 'sslDomainCertFile: ' + this.sslDomainCertFile);
    console.trace(info + 'sslCaBundleFile: ' + this.sslCaBundleFile);
    
    let router = this.router;
    let https = this.https;
    let certFileEncoding = 'utf8';

    if (this.fs.existsSync(this.sslKeyFile) === false) {
      throw 'sslKeyFile  was not found!';
    }
    if (this.fs.existsSync(this.sslDomainCertFile) === false) {
      throw 'sslDomainCertFile  was not found!';
    }
    let ssl = {
      key: this.fs.readFileSync(this.sslKeyFile, certFileEncoding),
      cert: this.fs.readFileSync(this.sslDomainCertFile, certFileEncoding)
    };

    if (this.fs.existsSync(this.sslCaBundleFile)) {
      console.trace(info + 'sslCaBundleFile found.');

      let ca, cert, chain, line, _i, _len;

      ca = [];

      chain = this.fs.readFileSync(this.sslCaBundleFile, certFileEncoding);

      chain = chain.split("\n");

      cert = [];

      for (_i = 0, _len = chain.length; _i < _len; _i++) {
        line = chain[_i];
        if (!(line.length !== 0)) {
          continue;
        }

        cert.push(line);

        if (line.match(/-END CERTIFICATE-/)) {
          ca.push(cert.join("\n"));
          cert = [];
        }
      }

      ssl.ca = ca;
    }
    
    if(this.enforceHttps) {
      console.log(info + 'Enforcing https');
      router.use((req, res, next) => {
        if(!req.secure) {
          return res.redirect(['https://', req.get('Host'), req.url].join(''));
        }
        next();
      });
    }
    

    console.log(info + 'Freshly certified server created...');
    return https.createServer(ssl, router);
  }
}

module.exports = function(config) {
	return (new FreshCert(config)).getSecureServer();
}