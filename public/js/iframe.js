// reassign the $ to $j so that jquery doesn't conflict with other libraries
var $j = jQuery.noConflict();

$j.getCSS = function(url) {
    if (document.createStyleSheet) {
        url = document.location.protocol + '//' + document.location.host + url;
        document.createStyleSheet(url);
    }
    else {
        $j(document.createElement('link')).attr({
            href: url,
            media: 'screen',
            type: 'text/css',
            rel: 'stylesheet'
        }).appendTo('head');
    }
};

$j.addCSS = function(css) {
    var style = "<style>\n";
    style += css + "</style>";
    $j(style).appendTo("head");
}

$j.addJS = function(code) {
    var js = "<script>\n";
    js += code + "</script>";
    $j(js).appendTo("head");
}

var __user_js = '';
var __jslib_loaded = true;
var __jsprefix_loaded = true;
var __jsmodernizr_loaded = true;
var __jsexternal_loaded = true;

var __renderIFrame = function(event) {
    var contentObj = JSON.parse(event.data);
    
    if(contentObj['error']) {
        // errors exist. show those
        var html = $j('html')[0];
        $j(html).html(contentObj['error']);
        $j.getCSS('/stylesheets/css/errors.css');
    }
    else {
        // HTML related
        var html = $j('html')[0];
        $j(html).html(contentObj['HTML']);
        $j(html).addClass(contentObj['HTML_CLASSES']);
        
        // CSS related
        if(contentObj['CSS_STARTER']) {
            $j.getCSS(contentObj['CSS_STARTER']);
        }
        else if(contentObj['CSS_EXTERNAL']) {
            $j.getCSS(contentObj['CSS_EXTERNAL']);
        }
        
        if(contentObj['PREFIX']) {
            // If we have prefix free lib to load, we should load that js
            // then prefix our css, then finally add the css to the head so that
            // the browser can render it
            __jsprefix_loaded = false;
            
            $j.getScript('/js/libs/prefixfree.min.js', function() {
                __jsprefix_loaded = true;
                var prefixedCSS = PrefixFree.prefixCSS(contentObj['CSS']);
                $j.addCSS(prefixedCSS);
            });
        }
        else {
            $j.addCSS(contentObj['CSS']);
        }
        
        // JS related
        __user_js = '';
        __jslib_loaded = true;
        __jsprefix_loaded = true;
        __jsmodernizr_loaded = true;
        __jsexternal_loaded = true;
        
        if(contentObj['JSLIBRARY']) {
            __jslib_loaded = false;
            
            // Since we already load jquery, give users access to $, instead of $j
            if(contentObj['JSLIBRARY'].indexOf('jquery') > -1) {
                $ = $j;
                __jslib_loaded = true;
            }
            else {
                $j.getScript(contentObj['JSLIBRARY'], function() {
                    __jslib_loaded = true;
                });
            }
        }
        
        if(contentObj['JS_MODERNIZR']) {
            __jsmodernizr_loaded = false;
            
            $j.getScript(contentObj['JS_MODERNIZR'], function() {
                __jsmodernizr_loaded = true;
            });
        }
        
        if(contentObj['JS_EXTERNAL']) {
            __jsexternal_loaded = false;
            
            $j.getScript(contentObj['JS_EXTERNAL'], function() {
                __jsexternal_loaded = true;
            });
        }
        
        __user_js = contentObj['JS'];
        __executeJS();
    }
}

var __loop_count = 0;
var __last_timeout = 0;

// Make sure to execute the user js after all the scripts have loaded
// If one of them fails to load, most likely user script, load it after 5 tries
var __executeJS = function() {
    if ((__jslib_loaded      && 
        __jsprefix_loaded    && 
        __jsmodernizr_loaded && 
        __jsexternal_loaded  ) || __loop_count > 5) {
        __loop_count = 0;
        
        $j.addJS(__user_js);
    }
    else {
        __loop_count += 1;
        setTimeout(__executeJS, 50);
    }
}

// Only used for browsers that support postMessage function
// IE6 and 7 will do a full refresh
if (window.addEventListener) {
    window.addEventListener('message', __renderIFrame, false);
} else {
    // IE browsers
    window.attachEvent('onmessage', __renderIFrame);
}
