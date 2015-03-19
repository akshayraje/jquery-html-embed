/**
 * jQuery HTML Embed
 * Version 1.0
 * 
 * By @zipapps, @akshayraje
 *
 **/

(function ( $ ) {     
 
    $.fn.htmlEmbed = function( options ) {        

        var $this = $(this);
        var settings = $.extend( {}, $.fn.htmlEmbed.defaults, options );

        var startmt = new Date().getTime();
        $( $this ).html( settings.processing ); 

        var 
        scheme = (document.location.protocol === 'https:' ? 'https' : 'http'),
        yql_data = {
            format: 'xml',
            q: 'select ' + settings.select + ' from html where url="' + settings.url + '" and compat="' + settings.compat + '"'
        };

        if( settings.xpath != null && settings.xpath != '' ){
            settings.xpath = settings.xpath.replace(/"/g, "'");
            yql_data.q += ' and xpath="' + settings.xpath + '"';
        };

        console.log(yql_data.q);

        if( settings.url != null && settings.url != '' ){

            cache_key = settings.url + settings.select + settings.xpath;

            var sessionCache = sessionStorage.getItem(cache_key);
            if(sessionCache !== null){
                sessionCache = JSON.parse(sessionCache);
            } else {
                sessionCache = null;
            }

            if( settings.base_href == '' )
                settings.base_href = settings.url;               

            if( (sessionCache !== null) && (new Date().getTime() - sessionCache._) < (settings.cache * 60000) ){

                parse( sessionCache.data );
                console.log( 'X-HTML-Embed-Cache-Control: Cache-hit sessionStorage' );
                console.log( 'Fetched ' + sessionCache.data.results.length + ' (' + settings.select + ') items from "' + settings.url + '" where xpath = "' + settings.xpath + '" in ' + (new Date().getTime() - startmt)/1000 + ' secs' ); 
                console.log( 'Output: ' + settings.output );

            } else {

                $.ajax({
                    url: scheme + '://query.yahooapis.com/v1/public/yql?diagnostics=true&callback=jsonp_callback&_maxage=' + (settings.cache * 60),
                    data: yql_data,
                    dataType: 'jsonp',
                    cache: true,
                    headers: {
                        'Cache-Control': 'max-age=' + (settings.cache * 60) 
                    },              
                    jsonp: false,
                    jsonpCallback: 'jsonp_callback',
                    success: function (data) {
                        console.log(data);
                        if( typeof data.query.diagnostics.url.error === 'undefined' && data.results.length > 0 ){
                            sessionStorage.setItem(cache_key, JSON.stringify({
                                _: new Date().getTime(),
                                data: data
                            }));

                            parse( data );
                            console.log( 'X-HTML-Embed-Cache-Control: Remote-fetch via YQL' );
                            console.log( 'Fetched ' + data.results.length + ' (' + settings.select + ') items from "' + settings.url + '" where xpath = "' + settings.xpath + '" in ' + (new Date().getTime() - startmt)/1000 + ' secs' ); 
                            console.log( 'Output: ' + settings.output );

                        } else if( typeof data.query.diagnostics.url.error !== 'undefined' ) {

                            log_error( 'Error fetching (' + settings.select + ') from "' + settings.url + '" where xpath = "' + settings.xpath + '". Details logged.' );
                            console.log( data.query.diagnostics.url );

                        } else if( data.results.length == 0 ) {

                            log_error( 'Error fetching (' + settings.select + ') from "' + settings.url + '" where xpath = "' + settings.xpath + '". No matching items' );

                        };
                    },
                    error: function (jqXHR, textStatus, errorThrown) {

                        log_error( 'Error fetching (' + settings.select + ') from "' + settings.url + '" where xpath = "' + settings.xpath + '". Details: ' + textStatus );

                    }
                });
            }
        } else {

            log_error( 'No URL specified' );

        }

        function parse( data ){
            if( settings.output === 'text'){
                $.each(data.results, function () {
                    $( $this ).append( $(this.toString()).text() )
                });
            } else {
                var HtmltoProcess = '';
                $.each(data.results, function () {
                    HtmltoProcess += this.toString();          
                }); 
                var $toProcess = $( '<div id="jquery-html-embed">' + HtmltoProcess + '</div>' ); 

                var doc = document, 
                    old_base = doc.getElementsByTagName('base')[0],
                    old_href = old_base && old_base.href,
                    doc_head = doc.head || doc.getElementsByTagName('head')[0],
                    our_base = old_base || doc_head.appendChild(doc.createElement('base')),
                    resolver = doc.createElement('a'),
                    resolved_url;

                if( settings.base_href != null && settings.base_href != '' ){
                    $toProcess.find('a,area,link').attr('href', function() {
                        if($(this).attr('href') !== undefined){
                            our_base.href = settings.base_href;
                            resolver.href = $(this).attr('href');                      
                            return resolver.href; 
                        }
                    });
                    $toProcess.find('iframe,img,input,script,source').attr('src', function() {
                        if($(this).attr('src') !== undefined){
                            our_base.href = settings.base_href;
                            resolver.href = $(this).attr('src');                      
                            return resolver.href;
                        }
                    });
                }

                if( settings.base_target != null )
                    $toProcess.find('a,form').attr('target', settings.base_target); 

                if (old_base) old_base.href = old_href;
                else doc_head.removeChild(our_base);

                $( $this ).html( $toProcess );                                                                              
            };             
        }

        function log_error( _error ){
            if(settings.error === '_error'){
                $( $this ).html(_error);
            } else {
                $( $this ).html(settings.error);
            }
            console.log( _error );       
        }
 
        return this;
 
    };     
 
    $.fn.htmlEmbed.defaults = {
        select: '*',
        url: null,
        xpath: null,
        compat: 'html5',
        output: 'html',
        processing: '',
        error: '',
        cache: 120,
        base_href: null,
        base_target: null
    };  

}( jQuery ));
