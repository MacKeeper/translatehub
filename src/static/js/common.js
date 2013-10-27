/**
 * Request branches from the server
 * @param callback(Branch[])
 */
function loadBranches( callback ) {
    $.getJSON( "/rest/branches", function ( allData ) {
        var branches = $.map( allData, function ( branchData ) {
            return new Branch( branchData )
        } )
        branches.sort( function ( a, b ) {
            return a.name.localeCompare( b.name )
        } )
        callback( branches )
    } )
}

function Branch( branch ) {
    this.name = branch.name
}

/**
 * Load keys for the specified branch
 * @param branch The branch name
 * @param callback(I18nKey[])
 */
function loadKeys( branch, callback ) {
    $.getJSON( "/rest/keys/" + branch + "?untranslated=true", function ( allData ) {

        var keys = [];

        allData.forEach( function ( keyData ) {
            var key;
            // New key?
            if ( !this.lastKey || this.lastKey.fullName != keyData.fullName ) {
                key = new I18nKey( keyData.fullName )
                keys.push( key )
            } else {
                key = this.lastKey
            }
            key.addLocale( createLocale( keyData.localeLevel, keyData.localeLanguage, keyData.localeCountryCode, keyData.localeVariant ), keyData.value )
            this.lastKey = key
            // return new I18nKey( keyData )
        } )

        callback( keys )
    } )
}

function I18nKey( fullName ) {
    var self = this
    this.fullName = fullName
    this.defaultValue = null
    this.values = []
}

I18nKey.prototype.addLocale = function ( locale, v ) {
    var value = ko.observable( v )

    value.subscribe( function ( newValue ) {
        $.post( "/rest/keys/" + globals.viewModel.selectedBranch().name + "/" + locale.getLocaleCode() + "/update", {key: this.fullName, value: newValue}, function ( data ) {
        } );
    } )

    var value = new I18nKeyValue( locale, value )
    if ( locale.localeLevel == 0 ) {
        this.defaultValue = value
    } else {
        this.values.push( value )
    }
}

function I18nKeyValue( locale, value ) {
    this.locale = locale
    this.value = value
}

I18nKeyValue.prototype.hasValue = function () {
    return this.value() && this.value().trim() != ""
}

function createLocale( localeLevel, localeLanguage, localeCountryCode, localeVariant ) {
    createLocale.localeCache = createLocale.localeCache || {}

    var fullLocale = [localeLevel, localeLanguage, localeCountryCode, localeVariant].filter(function ( n ) {
        return n
    } ).join( "_" )
    if ( !(fullLocale in createLocale.localeCache) ) {
        createLocale.localeCache[fullLocale] = new Locale( localeLevel, localeLanguage, localeCountryCode, localeVariant )
    }
    return createLocale.localeCache[fullLocale]
}

function Locale( localeLevel, localeLanguage, localeCountryCode, localeVariant ) {
    this.localeLevel = localeLevel
    this.localeLanguage = localeLanguage
    this.localeCountryCode = localeCountryCode
    this.localeVariant = localeVariant
}

Locale.prototype.getLocaleCode = function () {
    return [this.localeLanguage, this.localeCountryCode, this.localeVariant].filter(function ( n ) {
        return n
    } ).join( "_" )
}