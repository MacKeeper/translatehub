var mysql = require('mysql'),
    pool = mysql.createPool({
        host: 'dbprime.dev.8d.com',
        user: 'cloud',
        password: 'yessir',
        database: 'mdarveau_i18n'
    });

exports.mysql = mysql
exports.pool = pool