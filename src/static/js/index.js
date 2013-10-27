var globals = {};

(function ( globals ) {
    "use strict";

    // Attach ajax post error handler
    $( document ).ajaxError( function ( event, jqxhr, settings, exception ) {
        // TODO Pop an alert
        console.log( exception )
    } );

    ko.bindingHandlers.keyValueEditor = {
        init: function ( element, valueAccessor ) {
            var value = valueAccessor();

            var valueUnwrapped = ko.unwrap( value );

            if ( valueUnwrapped.locale.localeLevel == 0 ) {
                $( "<span data-bind='text: $data.value'/>" ).appendTo( element );
            } else {
                $( "<input data-bind='value: $data.value' style='width: 100%'/>" ).appendTo( element );
            }
        },
        update: function ( element, valueAccessor ) {
        }
    };

    // The view's data model
    var ViewModel = function () {
        var self = this

        // Array of Branch
        self.availableBranches = ko.observableArray( [] )
        self.selectedBranch = ko.observable()

        // Array of keys
        self.keys = ko.observableArray( [] )

        // Load initial state from server
        loadBranches( function ( branches ) {
            self.availableBranches( branches )

            var requestedBranch = localStorage.selectedBranch
            branches.forEach( function ( branch ) {
                if ( branch.name == requestedBranch ) {
                    self.selectedBranch( branch )
                }
            } )
        } )

        self.selectedBranch.subscribe( function ( newValue ) {
            // Save the last selected branch to browser storage
            if ( newValue ) {
                localStorage.selectedBranch = newValue.name

                loadKeys( newValue.name, function ( keys ) {
                    self.keys( keys )
                } )
            }
        } )

        self.test = function () {
            console.log( globals.viewModel.selectedBranch().name )
        }
    }

    globals.viewModel = new ViewModel()
    ko.applyBindings( globals.viewModel ) // This makes Knockout get to work

    // Define your library strictly...
})( globals );
