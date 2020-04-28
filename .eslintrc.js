module.exports = {
    plugins: ["node"],
    parserOptions: {
        ecmaVersion: 2018
    },
    extends: [
        "eslint-config-ambassify/node"
    ],
    rules: {
      "node/exports-style": [ 2, "module.exports" ],
      "node/no-missing-import": [ 2 ],
      "node/no-unpublished-import": [ 2 ]
    }
}
