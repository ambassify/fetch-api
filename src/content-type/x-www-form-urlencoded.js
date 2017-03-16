const QS = require('qs');

module.exports = {
    type: 'application/x-www-form-urlencoded',
    serializer: (data) => QS.stringify(data)
};
