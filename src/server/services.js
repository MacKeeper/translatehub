var inspect = require( 'eyes' ).inspector( {maxLength: false} )
var db = require( './db' )
var JSONStream = require( 'JSONStream' )

/**
 * Setup routes
 */
exports.setupRoutes = function ( app ) {

    app.get( '/rest/branches', function ( req, res ) {
        db.pool.getConnection( function ( err, connection ) {
            // Use the connection
            connection.query( "select name from I18nRelease \
                              where deleted=false", function ( err, rows ) {
                // And done with the connection.
                connection.release()

                if ( err ) {
                    res.send( 500, err )
                } else {
                    res.send( rows )
                }
            } )
        } )
    } )

    app.get( '/rest/keys/:branch', function ( req, res ) {
        var branch = req.params.branch
        var locale = req.query.locale
        var includeDeletedKeys = req.query.deleted
        var untranslatedOnly = req.query.untranslated

        console.log( 'Branch: ' + branch )
        console.log( 'Locale: ' + locale )
        console.log( 'includeDeletedKeys: ' + includeDeletedKeys )
        console.log( 'untranslatedOnly: ' + untranslatedOnly )

        if ( !branch ) {
            res.send( 400, "Require 'branch' defined by '/rest/keys/:branch'" )
            return
        }

        db.pool.getConnection( function ( err, connection ) {
            if ( err ) {
                throw err;
            }

            // Use the connection
            var query = connection.query( "select distinct k.fullName, l.level localeLevel, l.languageCode localeLanguage, l.countryCode localeCountryCode, l.variant localeVariant, v.value value from I18nKeyEntity k\
                              join I18nRelease r on k.release_id=r.id and r.name=?\
                              join I18nKeyValue v on v.keyEntity_id=k.id\
                              join I18nLocale l on v.locale_id=l.id " + (locale ?
                "and CONCAT_WS('_', l.languageCode, CASE l.countryCode WHEN '' THEN NULL ELSE l.countryCode END, CASE l.variant WHEN '' THEN NULL ELSE l.variant END) in (" +
                    connection.escape( locale ) + ") " : "") + (untranslatedOnly ?
                "left join I18nKeyValue untranslatedValue on untranslatedValue.keyEntity_id=k.id join I18nLocale untranslatedValueLocale on untranslatedValue.locale_id=untranslatedValueLocale.id and untranslatedValueLocale.level!=0 " :
                "") + "where k.translatable=true " + (includeDeletedKeys == true ? "" : "and k.deleted=false ") +
                                              (untranslatedOnly ? "and (untranslatedValue.value is null or untranslatedValue.value='') " : "") +
                                              "order by k.fullName asc, l.level asc, l.languageCode asc", [branch], function ( err, rows ) {

                // And done with the connection.
                connection.release();

                if ( err ) {
                    res.send( 500, err )
                } else {
                    res.send( rows )
                }
            } )

            console.log( query.sql )
        } )
    } )

    app.post( '/rest/keys/:branch/:locale/update', function ( req, res ) {
        var branch = req.params.branch
        var locale = req.params.locale
        var key = req.body.key
        var value = req.body.value

        if ( !branch || branch == "" ) {
            res.send( 400, "Require 'locale' in path'" )
            return
        }

        if ( !key ) {
            res.send( 400, "Require 'key' in body'" )
            return
        }

        if ( !locale || locale == "" ) {
            res.send( 400, "Require 'locale' in path'" )
            return
        }

        if ( !value ) {
            res.send( 400, "Require 'value' in body'" )
            return
        }

        console.log( "Updating value of '" + key + "' (" + locale + ") of '" + branch + "' to '" + value + "'" )

        db.pool.getConnection( function ( err, connection ) {
            // Use the connection
            connection.query( "update I18nKeyEntity k\
                                join I18nRelease r on k.release_id=r.id\
                                left join I18nKeyValue v on k.id=v.keyEntity_id\
                                left join I18nLocale l on v.locale_id=l.id\
                                set v.value=?\
                                where r.name=? and k.fullName=? and CONCAT_WS('_', l.languageCode, CASE l.countryCode WHEN '' THEN NULL ELSE l.countryCode END, CASE l.variant WHEN '' THEN NULL ELSE l.variant END) = ?",
                              [value, branch, key, locale], function ( err, rows ) {
                    // And done with the connection.
                    connection.release()

                    if ( err ) {
                        res.send( 500, err )
                    } else {
                        res.send( rows )
                    }
                } )
        } )

    } )

    app.get( '/rest/locales/:branch', function ( req, res ) {
        var branch = req.params.branch

        if ( !branch ) {
            res.send( 400, "Require 'branch' defined by '/rest/keys/:branch'" )
            return
        }

        db.pool.getConnection( function ( err, connection ) {
            // Use the connection
            connection.query( "select level, languageCode, countryCode, variant from I18nLocale l \
                              join I18nRelease_I18nLocale lr on lr.locales_id=l.id \
                              join I18nRelease r on r.id=lr.I18nRelease_id \
                              where r.name=:branch\
                              order by level asc", {branch: branch}, function ( err, rows ) {
                // And done with the connection.
                connection.release()

                if ( err ) {
                    res.send( 500, err )
                } else {
                    res.send( rows )
                }
            } )
        } )
    } )

}