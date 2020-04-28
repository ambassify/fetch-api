/* global describe, before, afterEach, it */

const nock = require('nock');
const assert = require('assert');

describe('# retries', () => {

    const FetchAPI = require('..');

    before(() => {
        nock.cleanAll();
    });

    afterEach(() => {
        nock.cleanAll();
    });

    it ('Should retry failed requests', async () => {
        const responses = [
            [ 503, { message: 'request failed' }],
            [ 200, { id: 'hello', name: 'world' }],
        ];

        nock('https://test.ambassify.eu')
            .get('/hello-world')
            .times(2)
            .reply(() => responses.shift());

        const api = new FetchAPI({
            baseUrl: 'https://test.ambassify.eu',
            retry: 3,
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

    it ('Should not retry invalid requests', async () => {
        const responses = [
            [ 400, { message: 'missing parameter' }],
            [ 200, { id: 'hello', name: 'world' }],
        ];

        nock('https://test.ambassify.eu')
            .get('/hello-world')
            .times(2)
            .reply(() => responses.shift());

        const api = new FetchAPI({
            baseUrl: 'https://test.ambassify.eu',
            retry: 3
        });

        const fixt_error = {
            code: 400,
            name: 'RequestFailedError',
            message: 'Request to https://test.ambassify.eu/hello-world failed with status 400'
        };

        await assert.rejects(async () => {
            await api.get('/hello-world');
        }, fixt_error);
    });

    it ('Should explicitly enable retries', async () => {
        const responses = [
            [ 503, { message: 'server has gone' }],
            [ 200, { id: 'hello', name: 'world' }],
        ];

        nock('https://test.ambassify.eu')
            .get('/hello-world')
            .reply(() => responses.shift());

        const api = new FetchAPI({
            baseUrl: 'https://test.ambassify.eu',
        });

        const fixt_error = {
            code: 503,
            name: 'RequestFailedError',
            message: 'Request to https://test.ambassify.eu/hello-world failed with status 503'
        };

        await assert.rejects(async () => {
            await api.get('/hello-world');
        }, fixt_error);
    });

    it ('Should support all retries options', async () => {
        const responses = [
            [ 400, { message: 'server has gone' }],
            [ 200, { id: 'hello', name: 'world' }],
        ];

        nock('https://test.ambassify.eu')
            .get('/hello-world')
            .times(2)
            .reply(() => responses.shift());

        const api = new FetchAPI({
            baseUrl: 'https://test.ambassify.eu',
            retry: {
                retries: 3,
                isOK: r => r.status < 400
            }
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
