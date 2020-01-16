const { FetchApiError, RequestFailedError } = require('./error');
const { concat, injectQueryParams } = require('./url');

const serializers = {};
const deserializers = [];

function defineDeserializer(on, matcher, deserialize) {
    if (typeof matcher == 'string') {
        const str = matcher;

        if (str.indexOf(';') > -1)
            matcher = contentType => contentType == str;
        else if (typeof str == 'string')
            matcher = contentType => (contentType || '').split(';').shift() == str;
    }

    if (typeof matcher !== 'function')
        throw new FetchApiError('ResponseType matcher needs to be a function');

    if (typeof deserialize !== 'function')
        throw new FetchApiError('ResponseType deserialize needs to be a function');

    on.unshift({ matcher, deserialize });
}

/**
 * Default JSON response parser
 * application/json
 * application/(*)+json
 */
defineDeserializer(
    deserializers,
    s => /^application\/([^+]+\+)?json/.test(s),
    res => res.json()
);

/**
 * Default text response parser
 * text/*
 */
defineDeserializer(
    deserializers,
    s => /^text\//.test(s),
    res => res.text()
);

function transformResponse(res) {
    return {
        type: res.type,
        url: res.url,
        redirected: res.redirected,
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
        headers: res.headers
    };
}

class FetchApi {
    constructor(options = {}) {
        const {
            fetch,
            fetchOptions = {},
            baseUrl,
            headers,
            contentType,
            deserialize = true,
        } = options;

        if (!fetch)
            throw new FetchApiError('FetchApi requires fetch');

        this.fetch = fetch;
        this.fetchOptions = fetchOptions;
        this.baseUrl = baseUrl;

        this.deserialize = deserialize;
        this._deserializers = [];

        this.headers = headers || {};
        this.headers['content-type'] = this.headers['content-type'] || contentType;

        this.request = this.request.bind(this);
        this.get = this.get.bind(this);
        this.getAll = this.getAll.bind(this);
        this.post = this.post.bind(this);
        this.put = this.put.bind(this);
        this.patch = this.patch.bind(this);
        this.delete = this.delete.bind(this);

        this._respond = this._respond.bind(this);
    }

    _options(...options) {
        const headers = options.map(o => (o || {}).headers);
        const merged = Object.assign({}, this.fetchOptions, ...options);
        merged.headers = Object.assign({}, this.headers, ...headers);
        return merged;
    }

    _body(data, options) {
        const type = options.headers['content-type'];

        if (!serializers[type] || typeof data == 'string')
            return data;

        return serializers[type](data);
    }

    _request(url, options) {
        // Chrome gives strange "Illegal Invocation" errors when window.fetch
        // is assigned to an object and called like this.fetch.
        const _fetch = this.fetch;

        return _fetch(url, options)
            .catch(cause => this._error(false, url, {
                message: cause.message,
                type: cause.type,
                errno: cause.errno,
                code: cause.code
            }))
            .then(this._respond);
    }

    _respond(fetchRes) {
        let response = fetchRes;
        let deserializing = false;
        let bodyPromise = Promise.resolve();

        if (this.deserialize && response.status != 204) {
            const contentType = response.headers.get('content-type') || '';
            const deserializer = (
                this._deserializers.filter(d => d.matcher(contentType))[0] ||
                deserializers.filter(d => d.matcher(contentType))[0]
            );

            if (deserializer) {
                deserializing = true;
                bodyPromise = bodyPromise.then(() => deserializer.deserialize(fetchRes));
                response = transformResponse(fetchRes);
            }
        }

        return bodyPromise
            .catch(cause => this._error(false, response.url, { cause, response }))
            .then(body => {
                if (deserializing)
                    response.body = body;

                if (!response.ok)
                    this._error(response.status, response.url, ({ response }));

                return response;
            });
    }

    _error(status, url, extra) {
        throw new RequestFailedError(status, url, extra);
    }

    _getResources(/* resource, response */) {
        throw new FetchApiError('Subclasses of FetchApi need to implement _getResources to use getAll');
    }

    _getNextUrl(/* previous, response */) {
        throw new FetchApiError('Subclasses of FetchApi need to implement _getNextUrl to use getAll');
    }

    _getNextOptions(previous/* , response */) {
        return previous;
    }

    defineDeserializer(matcher, deserializer) {
        defineDeserializer(this._deserializers, matcher, deserializer);
    }

    isAbsolute(url) {
        return /^[a-z]+:\/\//i.test(url);
    }

    request(method, url, query, body, options) {
        if (!this.isAbsolute(url))
            url = concat(this.baseUrl, url);

        if (query)
            url = injectQueryParams(url, query);

        options = this._options({ method }, options);

        if (body && !options.body)
            options.body = this._body(body, options);


        const promise = this._request(url, options);
        promise.body = () => promise.then(res => res.body);
        return promise;
    }

    get(url, query, options) {
        return this.request('GET', url, query, undefined, options);
    }

    getAll(resource, url, query, options) {
        const resources = [];

        const more = (res) => {
            resources.push(...this._getResources(resource, res));

            const nextUrl = this._getNextUrl(url, res);
            const nextOptions = this._getNextOptions(options, res);

            if (!nextUrl)
                return resources;

            // The last requested URL is preserved in `url` and passed
            // along to `this._getNextUrl`
            url = nextUrl;
            options = nextOptions;

            return this.get(nextUrl, undefined, nextOptions).then(more);
        };

        return this.get(url, query, options).then(more);
    }

    post(url, body, options) {
        return this.request('POST', url, undefined, body, options);
    }

    put(url, body, options) {
        return this.request('PUT', url, undefined, body, options);
    }

    patch(url, body, options) {
        return this.request('PATCH', url, undefined, body, options);
    }

    delete(url, options) {
        return this.request('DELETE', url, undefined, undefined, options);
    }
}

FetchApi.Error = FetchApiError;
FetchApi.RequestFailedError = RequestFailedError;

FetchApi.ContentTypes = {};
FetchApi.defineContentType = (name, config) => {
    if (!config && name.type) {
        config = name;
        name = config.type;
    }

    FetchApi.ContentTypes[name] = config.type;
    serializers[config.type] = config.serializer;
};

FetchApi.defineDeserializer = (matcher, deserializer) => {
    defineDeserializer(deserializers, matcher, deserializer);
};

module.exports = FetchApi;
