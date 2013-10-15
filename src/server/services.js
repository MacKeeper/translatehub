var inspect = require('eyes').inspector({maxLength: false})
var db = require('./db')

/**
 * Setup routes
 */
exports.setupRoutes = function (app) {

    // req.params.
    // req.query.

    app.get('/rest/branches', function (req, res) {
        db.pool.getConnection(function (err, connection) {
            // Use the connection
            connection.query("select name from I18nRelease \
                              where deleted=false", function (err, rows) {
                // And done with the connection.
                connection.release();

                if (err) {
                    res.send(500, err)
                } else {
                    res.send(rows)
                }
            });
        });
    });

    // TODO Add support for untransalted
    // TODO Stream results
    app.get('/rest/keys/:branch', function (req, res) {
        var branch = req.params.branch
        var locale = req.query.locale
        var includeDeletedKeys = req.query.deleted
        var untranslatedOnly = req.query.untranslated

        console.log('Branch: ' + branch)
        console.log('Locale: ' + locale)
        console.log('includeDeletedKeys: ' + includeDeletedKeys)
        console.log('untranslatedOnly: ' + untranslatedOnly)

        if (!branch) {
            res.send(400, "Require 'branch' defined by '/rest/keys/:branch'")
            return;
        }

        db.pool.getConnection(function (err, connection) {
            // Use the connection
            var query = connection.query("select k.fullName, l.level, l.languageCode, l.countryCode, l.variant, v.value from I18nKeyEntity k\
                              join I18nRelease r on k.release_id=r.id and r.name=?\
                              join I18nKeyValue v on v.keyEntity_id=k.id\
                              join I18nLocale l on v.locale_id=l.id " + (locale ? "and CONCAT_WS('_', l.languageCode, CASE l.countryCode WHEN '' THEN NULL ELSE l.countryCode END, CASE l.variant WHEN '' THEN NULL ELSE l.variant END) in (" + connection.escape(locale) + ") " : "") +
                (untranslatedOnly ? "left join I18nKeyValue untranslatedValue on untranslatedValue.keyEntity_id=k.id ": "") +
                "where k.translatable=true " + (includeDeletedKeys == true ? "" : "and k.deleted=false ") + (untranslatedOnly ? "and untranslatedValue.value is null ": "") +
                "order by k.fullName asc, l.level asc, l.languageCode asc", [branch], function (err, rows) {

                // And done with the connection.
                connection.release();

                if (err) {
                    res.send(500, err)
                } else {
                    res.send(rows)
                }
            });

            console.log(query.sql)
        });
    });

    app.get('/rest/locales/:branch', function (req, res) {
        var branch = req.params.branch

        if (!branch) {
            res.send(400, "Require 'branch' defined by '/rest/keys/:branch'")
            return;
        }

        db.pool.getConnection(function (err, connection) {
            // Use the connection
            connection.query("select level, languageCode, countryCode, variant from I18nLocale l \
                              join I18nRelease_I18nLocale lr on lr.locales_id=l.id \
                              join I18nRelease r on r.id=lr.I18nRelease_id \
                              where r.name=?\
                              order by level asc", [branch], function (err, rows) {
                // And done with the connection.
                connection.release();

                if (err) {
                    res.send(500, err)
                } else {
                    res.send(rows)
                }
            });
        });
    });

}

//exports.get_stations = function (req, res) {
//
//    model.Station.find({}).exec(function (err, stations) {
//        if (err) {
//            inspect(err)
//            res.send(500)
//        } else {
//            res.send(stations)
//        }
//    })
//}
//
//exports.get_station_status_history = function (req, res) {
//
//    var query = model.StationStatus.find()
//        .where('stationid').equals(req.params.stationid)
//        .sort('snapshotTimestamp')
//
//    // Bounded start?
//    if (req.query.start) {
//        query.where('snapshotTimestamp').gte(new Date(req.query.start))
//    }
//
//    // Bounded end?
//    if (req.query.end) {
//        query.where('snapshotTimestamp').lte(new Date(req.query.end))
//    }
//
//    res.status(200)
//    res.type('application/json')
//
//    var datasent = false
//    res.write('[')
//    query.stream()
//        .on('data', function (status) {
//            if (datasent) {
//                res.write(',')
//            }
//            res.write(JSON.stringify(status))
//            datasent = true
//        })
//        .on('error', function (err) {
//            inspect(err)
//            res.status(500)
//            res.end()
//        })
//        .on('close', function () {
//            res.write(']')
//            res.end()
//        });
//
//}

