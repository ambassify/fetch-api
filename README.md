# fetch-api

![CircleCI](https://img.shields.io/circleci/project/github/ambassify/fetch-api.svg)
[![npm version](https://img.shields.io/npm/v/@ambassify/fetch-api.svg)](https://www.npmjs.com/package/@ambassify/fetch-api)
[![npm downloads](https://img.shields.io/npm/dt/@ambassify/fetch-api.svg)](https://www.npmjs.com/package/@ambassify/fetch-api)
[![maintainer](https://img.shields.io/badge/maintainer-Gertt-brightgreen.svg)](https://github.com/Gertt)

Small class to create easy to use API clients with fetch. It uses @ambassify/fetch under the hood to provide a default fetch implementation for browser and node.

# Usage

Install the package in your project:

`npm install --save @ambassify/fetch-api`

In your code:

```js
const FetchApi = require('@ambassify/fetch-api');

const api = new FetchApi({
    baseUrl: 'https://your-api.test',
    contentType: 'FORM',
});

api.get('/foo', { offset: 1, limit: 1 })
    .then(res => console.log(res.body))
    .catch(err => console.log(err));

api.post('/foo', { foo: 'bar' });
api.put('/foo/1', { foo: 'bar' });
api.patch('/foo/1', { foo: 'bar' });
api.delete('/foo/1');
```