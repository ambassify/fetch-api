/* global describe, before, afterEach, it */

const nock = require('nock');
const sinon = require('sinon');
const assert = require('assert');

describe('FetchAPI', () => {

    const FetchAPI = require('..');

    before(() => {
        nock.cleanAll();
    });

    afterEach(() => {
        nock.cleanAll();
    });

    it ('Should make requests relative to base URL', async () => {
        nock('https://test.ambassify.eu')
            .get('/api/hello-world')
            .reply(200, { id: 'hello', name: 'world' });

        const api = new FetchAPI({
            baseUrl: 'https://test.ambassify.eu/api'
        });

        const body = await api.get('/hello-world').body();

        assert.deepEqual(body, {
            id: 'hello',
            name: 'world'
        });
    });

    it ('Should perform absolute URL requests', async () => {
        nock('https://test1.ambassify.eu')
            .get('/hello-world')
            .reply(200, { id: 'hello', name: 'world' });

        const api = new FetchAPI({
            baseUrl: 'https://test.ambassify.eu'
        });

        const body = await api.get('https://test1.ambassify.eu/hello-world').body();

        assert.deepEqual(body, {
            id: 'hello',
            name: 'world'
        });
    });

    it ('Should accept custom fetch method', async () => {
        const customFetch = sinon.spy(async () => ({
            ok: true,
            status: 204
        }));
        const api = new FetchAPI({
            baseUrl: 'https://test.ambassify.eu',
            fetch: customFetch
        });

        await api.get('/hello-world');
        assert.equal(customFetch.callCount, 1);

        await api.get('/hello-world');
        await api.get('/hello-world');
        assert.equal(customFetch.callCount, 3);
    });

    it ('Should expose a body method on promise', async () => {
        nock('https://test.ambassify.eu')
            .get('/hello-world')
            .reply(200, { id: 'hello', name: 'world' });

        const api = new FetchAPI({
            baseUrl: 'https://test.ambassify.eu'
        });

        const promise = api.get('/hello-world');
        assert.equal(typeof promise.then, 'function');
        assert.equal(typeof promise.catch, 'function');
        assert.equal(typeof promise.body, 'function');

        const bodyPromise = promise.body();
        assert.equal(typeof bodyPromise.then, 'function');
        assert.equal(typeof bodyPromise.catch, 'function');

        const body = await bodyPromise;

        assert.deepEqual(body, {
            id: 'hello',
            name: 'world'
        });
    });

    it ('Should provide status, body and headers', async () => {
        nock('https://test.ambassify.eu')
            .get('/hello-world')
            .reply(200, { id: 'hello', name: 'world' });

        const api = new FetchAPI({
            baseUrl: 'https://test.ambassify.eu'
        });

        const resp = await api.get('/hello-world');
        assert.equal(resp.status, 200);
        assert.equal(resp.statusText, 'OK');
        assert.equal(typeof resp.headers, 'object');
        assert.deepEqual(resp.body, {
            id: 'hello',
            name: 'world'
        });
    });

});
