const fetch = require('node-fetch');
const FetchApi = require('./core');
const pkg = require('../package.json');

const USERAGENT = `${pkg.name}@${pkg.version}`;

FetchApi.defineContentType('JSON', require('./content-type/json'));
FetchApi.defineContentType('FORM', require('./content-type/x-www-form-urlencoded'));

class NodeFetchApi extends FetchApi {
    constructor(options = {}) {
        options.fetch = options.fetch || fetch;

        const timeout = options.timeout || 0;
        delete options.timeout;

        options.headers = options.headers || {};
        options.headers['user-agent'] = options.headers['user-agent'] || USERAGENT;

        super(options);

        this.timeout = timeout;
    }

    _options(...options) {
        if (this.timeout)
            options = [{ timeout: this.timeout }].concat(options);

        return super._options(...options);
    }
}

module.exports = NodeFetchApi;
