(function(src) {
  // SVG SUPPORT
  if( !Modernizr.svgforeignobject ) {
    loadJS( '/js/pollyfills/svg4everybody.legacy.min.js', function() {
      svg4everybody();
    });
  }

  if( !Modernizr.mediaqueries ) {
    loadJS( driveurl + '/js/pollyfills/respond.min.js' );
  }
})();

