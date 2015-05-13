/*!
 * jQuery Transit - CSS3 transitions and transformations
 * (c) 2011-2012 Rico Sta. Cruz
 * MIT Licensed.
 *
 * http://ricostacruz.com/jquery.transit
 * http://github.com/rstacruz/jquery.transit
 */

(function($) {
  $.transit = {
    version: "0.9.9",

    // Map of $.css() keys to values for 'transitionProperty'.
    // See https://developer.mozilla.org/en/CSS/CSS_transitions#Properties_that_can_be_animated
    propertyMap: {
      marginLeft    : 'margin',
      marginRight   : 'margin',
      marginBottom  : 'margin',
      marginTop     : 'margin',
      paddingLeft   : 'padding',
      paddingRight  : 'padding',
      paddingBottom : 'padding',
      paddingTop    : 'padding'
    },

    // Will simply transition "instantly" if false
    enabled: true,

    // Set this to false if you don't want to use the transition end property.
    useTransitionEnd: false
  };

  var div = document.createElement('div');
  var support = {};

  // Helper function to get the proper vendor property name.
  // (`transition` => `WebkitTransition`)
  function getVendorPropertyName(prop) {
    // Handle unprefixed versions (FF16+, for example)
    if (prop in div.style) return prop;

    var prefixes = ['Moz', 'Webkit', 'O', 'ms'];
    var prop_ = prop.charAt(0).toUpperCase() + prop.substr(1);

    if (prop in div.style) { return prop; }

    for (var i=0; i<prefixes.length; ++i) {
      var vendorProp = prefixes[i] + prop_;
      if (vendorProp in div.style) { return vendorProp; }
    }
  }

  // Helper function to check if transform3D is supported.
  // Should return true for Webkits and Firefox 10+.
  function checkTransform3dSupport() {
    div.style[support.transform] = '';
    div.style[support.transform] = 'rotateY(90deg)';
    return div.style[support.transform] !== '';
  }

  var isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;

  // Check for the browser's transitions support.
  support.transition      = getVendorPropertyName('transition');
  support.transitionDelay = getVendorPropertyName('transitionDelay');
  support.transform       = getVendorPropertyName('transform');
  support.transformOrigin = getVendorPropertyName('transformOrigin');
  support.filter          = getVendorPropertyName('Filter');
  support.transform3d     = checkTransform3dSupport();

  var eventNames = {
    'transition':       'transitionEnd',
    'MozTransition':    'transitionend',
    'OTransition':      'oTransitionEnd',
    'WebkitTransition': 'webkitTransitionEnd',
    'msTransition':     'MSTransitionEnd'
  };

  // Detect the 'transitionend' event needed.
  var transitionEnd = support.transitionEnd = eventNames[support.transition] || null;

  // Populate jQuery's `$.support` with the vendor prefixes we know.
  // As per [jQuery's cssHooks documentation](http://api.jquery.com/jQuery.cssHooks/),
  // we set $.support.transition to a string of the actual property name used.
  for (var key in support) {
    if (support.hasOwnProperty(key) && typeof $.support[key] === 'undefined') {
      $.support[key] = support[key];
    }
  }

  // Avoid memory leak in IE.
  div = null;

  // ## $.cssEase
  // List of easing aliases that you can use with `$.fn.transition`.
  $.cssEase = {
    '_default':       'ease',
    'in':             'ease-in',
    'out':            'ease-out',
    'in-out':         'ease-in-out',
    'snap':           'cubic-bezier(0,1,.5,1)',
    // Penner equations
    'easeOutCubic':   'cubic-bezier(.215,.61,.355,1)',
    'easeInOutCubic': 'cubic-bezier(.645,.045,.355,1)',
    'easeInCirc':     'cubic-bezier(.6,.04,.98,.335)',
    'easeOutCirc':    'cubic-bezier(.075,.82,.165,1)',
    'easeInOutCirc':  'cubic-bezier(.785,.135,.15,.86)',
    'easeInExpo':     'cubic-bezier(.95,.05,.795,.035)',
    'easeOutExpo':    'cubic-bezier(.19,1,.22,1)',
    'easeInOutExpo':  'cubic-bezier(1,0,0,1)',
    'easeInQuad':     'cubic-bezier(.55,.085,.68,.53)',
    'easeOutQuad':    'cubic-bezier(.25,.46,.45,.94)',
    'easeInOutQuad':  'cubic-bezier(.455,.03,.515,.955)',
    'easeInQuart':    'cubic-bezier(.895,.03,.685,.22)',
    'easeOutQuart':   'cubic-bezier(.165,.84,.44,1)',
    'easeInOutQuart': 'cubic-bezier(.77,0,.175,1)',
    'easeInQuint':    'cubic-bezier(.755,.05,.855,.06)',
    'easeOutQuint':   'cubic-bezier(.23,1,.32,1)',
    'easeInOutQuint': 'cubic-bezier(.86,0,.07,1)',
    'easeInSine':     'cubic-bezier(.47,0,.745,.715)',
    'easeOutSine':    'cubic-bezier(.39,.575,.565,1)',
    'easeInOutSine':  'cubic-bezier(.445,.05,.55,.95)',
    'easeInBack':     'cubic-bezier(.6,-.28,.735,.045)',
    'easeOutBack':    'cubic-bezier(.175, .885,.32,1.275)',
    'easeInOutBack':  'cubic-bezier(.68,-.55,.265,1.55)'
  };

  // ## 'transform' CSS hook
  // Allows you to use the `transform` property in CSS.
  //
  //     $("#hello").css({ transform: "rotate(90deg)" });
  //
  //     $("#hello").css('transform');
  //     //=> { rotate: '90deg' }
  //
  $.cssHooks['transit:transform'] = {
    // The getter returns a `Transform` object.
    get: function(elem) {
      return $(elem).data('transform') || new Transform();
    },

    // The setter accepts a `Transform` object or a string.
    set: function(elem, v) {
      var value = v;

      if (!(value instanceof Transform)) {
        value = new Transform(value);
      }

      // We've seen the 3D version of Scale() not work in Chrome when the
      // element being scaled extends outside of the viewport.  Thus, we're
      // forcing Chrome to not use the 3d transforms as well.  Not sure if
      // translate is affectede, but not risking it.  Detection code from
      // http://davidwalsh.name/detecting-google-chrome-javascript
      if (support.transform === 'WebkitTransform' && !isChrome) {
        elem.style[support.transform] = value.toString(true);
      } else {
        elem.style[support.transform] = value.toString();
      }

      $(elem).data('transform', value);
    }
  };

  // Add a CSS hook for `.css({ transform: '...' })`.
  // In jQuery 1.8+, this will intentionally override the default `transform`
  // CSS hook so it'll play well with Transit. (see issue #62)
  $.cssHooks.transform = {
    set: $.cssHooks['transit:transform'].set
  };

  // ## 'filter' CSS hook
  // Allows you to use the `filter` property in CSS.
  //
  //     $("#hello").css({ filter: 'blur(10px)' });
  //
  $.cssHooks.filter = {
    get: function(elem) {
      return elem.style[support.filter];
    },
    set: function(elem, value) {
      elem.style[support.filter] = value;
    }
  };

  // jQuery 1.8+ supports prefix-free transitions, so these polyfills will not
  // be necessary.
  if ($.fn.jquery < "1.8") {
    // ## 'transformOrigin' CSS hook
    // Allows the use for `transformOrigin` to define where scaling and rotation
    // is pivoted.
    //
    //     $("#hello").css({ transformOrigin: '0 0' });
    //
    $.cssHooks.transformOrigin = {
      get: function(elem) {
        return elem.style[support.transformOrigin];
      },
      set: function(elem, value) {
        elem.style[support.transformOrigin] = value;
      }
    };

    // ## 'transition' CSS hook
    // Allows you to use the `transition` property in CSS.
    //
    //     $("#hello").css({ transition: 'all 0 ease 0' });
    //
    $.cssHooks.transition = {
      get: function(elem) {
        return elem.style[support.transition];
      },
      set: function(elem, value) {
        elem.style[support.transition] = value;
      }
    };
  }

  // ## Other CSS hooks
  // Allows you to rotate, scale and translate.
  registerCssHook('scale');
  registerCssHook('translate');
  registerCssHook('rotate');
  registerCssHook('rotateX');
  registerCssHook('rotateY');
  registerCssHook('rotate3d');
  registerCssHook('perspective');
  registerCssHook('skewX');
  registerCssHook('skewY');
  registerCssHook('x', true);
  registerCssHook('y', true);

  // ## Transform class
  // This is the main class of a transformation property that powers
  // `$.fn.css({ transform: '...' })`.
  //
  // This is, in essence, a dictionary object with key/values as `-transform`
  // properties.
  //
  //     var t = new Transform("rotate(90) scale(4)");
  //
  //     t.rotate             //=> "90deg"
  //     t.scale              //=> "4,4"
  //
  // Setters are accounted for.
  //
  //     t.set('rotate', 4)
  //     t.rotate             //=> "4deg"
  //
  // Convert it to a CSS string using the `toString()` and `toString(true)` (for WebKit)
  // functions.
  //
  //     t.toString()         //=> "rotate(90deg) scale(4,4)"
  //     t.toString(true)     //=> "rotate(90deg) scale3d(4,4,0)" (WebKit version)
  //
  function Transform(str) {
    if (typeof str === 'string') { this.parse(str); }
    return this;
  }

  Transform.prototype = {
    // ### setFromString()
    // Sets a property from a string.
    //
    //     t.setFromString('scale', '2,4');
    //     // Same as set('scale', '2', '4');
    //
    setFromString: function(prop, val) {
      var args =
        (typeof val === 'string')  ? val.split(',') :
        (val.constructor === Array) ? val :
        [ val ];

      args.unshift(prop);

      Transform.prototype.set.apply(this, args);
    },

    // ### set()
    // Sets a property.
    //
    //     t.set('scale', 2, 4);
    //
    set: function(prop) {
      var args = Array.prototype.slice.apply(arguments, [1]);
      if (this.setter[prop]) {
        this.setter[prop].apply(this, args);
      } else {
        this[prop] = args.join(',');
      }
    },

    get: function(prop) {
      if (this.getter[prop]) {
        return this.getter[prop].apply(this);
      } else {
        return this[prop] || 0;
      }
    },

    setter: {
      // ### rotate
      //
      //     .css({ rotate: 30 })
      //     .css({ rotate: "30" })
      //     .css({ rotate: "30deg" })
      //     .css({ rotate: "30deg" })
      //
      rotate: function(theta) {
        this.rotate = unit(theta, 'deg');
      },

      rotateX: function(theta) {
        this.rotateX = unit(theta, 'deg');
      },

      rotateY: function(theta) {
        this.rotateY = unit(theta, 'deg');
      },

      // ### scale
      //
      //     .css({ scale: 9 })      //=> "scale(9,9)"
      //     .css({ scale: '3,2' })  //=> "scale(3,2)"
      //
      scale: function(x, y) {
        if (y === undefined) { y = x; }
        this.scale = x + "," + y;
      },

      // ### skewX + skewY
      skewX: function(x) {
        this.skewX = unit(x, 'deg');
      },

      skewY: function(y) {
        this.skewY = unit(y, 'deg');
      },

      // ### perspectvie
      perspective: function(dist) {
        this.perspective = unit(dist, 'px');
      },

      // ### x / y
      // Translations. Notice how this keeps the other value.
      //
      //     .css({ x: 4 })       //=> "translate(4px, 0)"
      //     .css({ y: 10 })      //=> "translate(4px, 10px)"
      //
      x: function(x) {
        this.set('translate', x, null);
      },

      y: function(y) {
        this.set('translate', null, y);
      },

      // ### translate
      // Notice how this keeps the other value.
      //
      //     .css({ translate: '2, 5' })    //=> "translate(2px, 5px)"
      //
      translate: function(x, y) {
        if (this._translateX === undefined) { this._translateX = 0; }
        if (this._translateY === undefined) { this._translateY = 0; }

        if (x !== null && x !== undefined) { this._translateX = unit(x, 'px'); }
        if (y !== null && y !== undefined) { this._translateY = unit(y, 'px'); }

        this.translate = this._translateX + "," + this._translateY;
      }
    },

    getter: {
      x: function() {
        return this._translateX || 0;
      },

      y: function() {
        return this._translateY || 0;
      },

      scale: function() {
        var s = (this.scale || "1,1").split(',');
        if (s[0]) { s[0] = parseFloat(s[0]); }
        if (s[1]) { s[1] = parseFloat(s[1]); }

        // "2.5,2.5" => 2.5
        // "2.5,1" => [2.5,1]
        return (s[0] === s[1]) ? s[0] : s;
      },

      rotate3d: function() {
        var s = (this.rotate3d || "0,0,0,0deg").split(',');
        for (var i=0; i<=3; ++i) {
          if (s[i]) { s[i] = parseFloat(s[i]); }
        }
        if (s[3]) { s[3] = unit(s[3], 'deg'); }

        return s;
      }
    },

    // ### parse()
    // Parses from a string. Called on constructor.
    parse: function(str) {
      var self = this;
      str.replace(/([a-zA-Z0-9]+)\((.*?)\)/g, function(x, prop, val) {
        self.setFromString(prop, val);
      });
    },

    // ### toString()
    // Converts to a `transition` CSS property string. If `use3d` is given,
    // it converts to a `-webkit-transition` CSS property string instead.
    toString: function(use3d) {
      var re = [];

      for (var i in this) {
        if (this.hasOwnProperty(i)) {
          // Don't use 3D transformations if the browser can't support it.
          if ((!support.transform3d) && (
            (i === 'rotateX') ||
            (i === 'rotateY') ||
            (i === 'perspective') ||
            (i === 'transformOrigin'))) { continue; }

          if (i[0] !== '_') {
            if (use3d && (i === 'scale')) {
              re.push(i + "3d(" + this[i] + ",1)");
            } else if (use3d && (i === 'translate')) {
              re.push(i + "3d(" + this[i] + ",0)");
            } else {
              re.push(i + "(" + this[i] + ")");
            }
          }
        }
      }

      return re.join(" ");
    }
  };

  function callOrQueue(self, queue, fn) {
    if (queue === true) {
      self.queue(fn);
    } else if (queue) {
      self.queue(queue, fn);
    } else {
      fn();
    }
  }

  // ### getProperties(dict)
  // Returns properties (for `transition-property`) for dictionary `props`. The
  // value of `props` is what you would expect in `$.css(...)`.
  function getProperties(props) {
    var re = [];

    $.each(props, function(key) {
      key = $.camelCase(key); // Convert "text-align" => "textAlign"
      key = $.transit.propertyMap[key] || $.cssProps[key] || key;
      key = uncamel(key); // Convert back to dasherized

      // Get vendor specify propertie
      if (support[key])
        key = uncamel(support[key]);

      if ($.inArray(key, re) === -1) { re.push(key); }
    });

    return re;
  }

  // ### getTransition()
  // Returns the transition string to be used for the `transition` CSS property.
  //
  // Example:
  //
  //     getTransition({ opacity: 1, rotate: 30 }, 500, 'ease');
  //     //=> 'opacity 500ms ease, -webkit-transform 500ms ease'
  //
  function getTransition(properties, duration, easing, delay) {
    // Get the CSS properties needed.
    var props = getProperties(properties);

    // Account for aliases (`in` => `ease-in`).
    if ($.cssEase[easing]) { easing = $.cssEase[easing]; }

    // Build the duration/easing/delay attributes for it.
    var attribs = '' + toMS(duration) + ' ' + easing;
    if (parseInt(delay, 10) > 0) { attribs += ' ' + toMS(delay); }

    // For more properties, add them this way:
    // "margin 200ms ease, padding 200ms ease, ..."
    var transitions = [];
    $.each(props, function(i, name) {
      transitions.push(name + ' ' + attribs);
    });

    return transitions.join(', ');
  }

  // ## $.fn.transition
  // Works like $.fn.animate(), but uses CSS transitions.
  //
  //     $("...").transition({ opacity: 0.1, scale: 0.3 });
  //
  //     // Specific duration
  //     $("...").transition({ opacity: 0.1, scale: 0.3 }, 500);
  //
  //     // With duration and easing
  //     $("...").transition({ opacity: 0.1, scale: 0.3 }, 500, 'in');
  //
  //     // With callback
  //     $("...").transition({ opacity: 0.1, scale: 0.3 }, function() { ... });
  //
  //     // With everything
  //     $("...").transition({ opacity: 0.1, scale: 0.3 }, 500, 'in', function() { ... });
  //
  //     // Alternate syntax
  //     $("...").transition({
  //       opacity: 0.1,
  //       duration: 200,
  //       delay: 40,
  //       easing: 'in',
  //       complete: function() { /* ... */ }
  //      });
  //
  $.fn.transition = $.fn.transit = function(properties, duration, easing, callback) {
    var self  = this;
    var delay = 0;
    var queue = true;

    var theseProperties = jQuery.extend(true, {}, properties);

    // Account for `.transition(properties, callback)`.
    if (typeof duration === 'function') {
      callback = duration;
      duration = undefined;
    }

    // Account for `.transition(properties, options)`.
    if (typeof duration === 'object') {
      easing = duration.easing;
      delay = duration.delay || 0;
      queue = duration.queue || true;
      callback = duration.complete;
      duration = duration.duration;
    }

    // Account for `.transition(properties, duration, callback)`.
    if (typeof easing === 'function') {
      callback = easing;
      easing = undefined;
    }

    // Alternate syntax.
    if (typeof theseProperties.easing !== 'undefined') {
      easing = theseProperties.easing;
      delete theseProperties.easing;
    }

    if (typeof theseProperties.duration !== 'undefined') {
      duration = theseProperties.duration;
      delete theseProperties.duration;
    }

    if (typeof theseProperties.complete !== 'undefined') {
      callback = theseProperties.complete;
      delete theseProperties.complete;
    }

    if (typeof theseProperties.queue !== 'undefined') {
      queue = theseProperties.queue;
      delete theseProperties.queue;
    }

    if (typeof theseProperties.delay !== 'undefined') {
      delay = theseProperties.delay;
      delete theseProperties.delay;
    }

    // Set defaults. (`400` duration, `ease` easing)
    if (typeof duration === 'undefined') { duration = $.fx.speeds._default; }
    if (typeof easing === 'undefined')   { easing = $.cssEase._default; }

    duration = toMS(duration);

    // Build the `transition` property.
    var transitionValue = getTransition(theseProperties, duration, easing, delay);

    // Compute delay until callback.
    // If this becomes 0, don't bother setting the transition property.
    var work = $.transit.enabled && support.transition;
    var i = work ? (parseInt(duration, 10) + parseInt(delay, 10)) : 0;

    // If there's nothing to do...
    if (i === 0) {
      var fn = function(next) {
        self.css(theseProperties);
        if (callback) { callback.apply(self); }
        if (next) { next(); }
      };

      callOrQueue(self, queue, fn);
      return self;
    }

    // Save the old transitions of each element so we can restore it later.
    var oldTransitions = {};

    var run = function(nextCall) {
      var bound = false;

      // Prepare the callback.
      var cb = function() {
        if (bound) { self.unbind(transitionEnd, cb); }

        if (i > 0) {
          self.each(function() {
            this.style[support.transition] = (oldTransitions[this] || null);
          });
        }

        if (typeof callback === 'function') { callback.apply(self); }
        if (typeof nextCall === 'function') { nextCall(); }
      };

      if ((i > 0) && (transitionEnd) && ($.transit.useTransitionEnd)) {
        // Use the 'transitionend' event if it's available.
        bound = true;
        self.bind(transitionEnd, cb);
      } else {
        // Fallback to timers if the 'transitionend' event isn't supported.
        window.setTimeout(cb, i);
      }

      // Apply transitions.
      self.each(function() {
        if (i > 0) {
          this.style[support.transition] = transitionValue;
        }
        $(this).css(properties);
      });
    };

    // Defer running. This allows the browser to paint any pending CSS it hasn't
    // painted yet before doing the transitions.
    var deferredRun = function(next) {
        this.offsetWidth; // force a repaint
        run(next);
    };

    // Use jQuery's fx queue.
    callOrQueue(self, queue, deferredRun);

    // Chainability.
    return this;
  };

  function registerCssHook(prop, isPixels) {
    // For certain properties, the 'px' should not be implied.
    if (!isPixels) { $.cssNumber[prop] = true; }

    $.transit.propertyMap[prop] = support.transform;

    $.cssHooks[prop] = {
      get: function(elem) {
        var t = $(elem).css('transit:transform');
        return t.get(prop);
      },

      set: function(elem, value) {
        var t = $(elem).css('transit:transform');
        t.setFromString(prop, value);

        $(elem).css({ 'transit:transform': t });
      }
    };

  }

  // ### uncamel(str)
  // Converts a camelcase string to a dasherized string.
  // (`marginLeft` => `margin-left`)
  function uncamel(str) {
    return str.replace(/([A-Z])/g, function(letter) { return '-' + letter.toLowerCase(); });
  }

  // ### unit(number, unit)
  // Ensures that number `number` has a unit. If no unit is found, assume the
  // default is `unit`.
  //
  //     unit(2, 'px')          //=> "2px"
  //     unit("30deg", 'rad')   //=> "30deg"
  //
  function unit(i, units) {
    if ((typeof i === "string") && (!i.match(/^[\-0-9\.]+$/))) {
      return i;
    } else {
      return "" + i + units;
    }
  }

  // ### toMS(duration)
  // Converts given `duration` to a millisecond string.
  //
  // toMS('fast') => $.fx.speeds[i] => "200ms"
  // toMS('normal') //=> $.fx.speeds._default => "400ms"
  // toMS(10) //=> '10ms'
  // toMS('100ms') //=> '100ms'  
  //
  function toMS(duration) {
    var i = duration;

    // Allow string durations like 'fast' and 'slow', without overriding numeric values.
    if (typeof i === 'string' && (!i.match(/^[\-0-9\.]+/))) { i = $.fx.speeds[i] || $.fx.speeds._default; }

    return unit(i, 'ms');
  }

  // Export some functions for testable-ness.
  $.transit.getTransitionValue = getTransition;
})(jQuery);

var $localStorage={gc:function(objName){var arrStr=document.cookie.split("; ");for(var i=0;i<arrStr.length;i++){var temp=arrStr[i].split("=");if(temp[0]==objName)return unescape(temp[1])}},sc:function(objName,objValue,objHours){var str=objName+"="+escape(objValue);(objHours==undefined)&&(objHours=24);if(objHours>0){var date=new Date();var ms=objHours*3600*1000;date.setTime(date.getTime()+ms);str+="; expires="+date.toGMTString()}document.cookie=str},dc:function(objName){this.sc(objName,"")},setData:function(key,val,besession){var storage=besession?window.sessionStorage:window.localStorage;if(storage){storage.setItem(key,val)}else{this.sc(key,val)}},getData:function(key,besession){var storage=besession?window.sessionStorage:window.localStorage;if(storage){return storage.getItem(key)}else{return this.gc(key)}},delData:function(key,besession){var storage=besession?window.sessionStorage:window.localStorage;if(storage){storage.removeItem(key)}else{this.dc(key)}},clearData:function(besession){var storage=besession?window.sessionStorage:window.localStorage;if(storage){storage.clear()}else{document.cookie=""}}};

var ua 		=	navigator.userAgent,
	android = 	ua.match(/(Android);?[\s\/]+([\d.]+)?/),
	ipad 	= 	ua.match(/(iPad).*OS\s([\d_]+)/),
	ipod 	= 	ua.match(/(iPod)(.*OS\s([\d_]+))?/),
	iphone 	= 	!ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/);

var dataForWeixin={
    appId:'',
    b:false,
    MsgImg:'http://1251063774.cdn.myqcloud.com/1251063774/jieshao/images/share.jpg',
    TLImg:'http://1251063774.cdn.myqcloud.com/1251063774/jieshao/images/share.jpg',
    link:'http://themoment.weishi.com/jieshao',
    title:'微视此刻',
    desc:'你的每一刻生活都值得被铭记',
    callback:function(s){
    	var array=s.split(":");
    	if(array[0]=="send_app_msg" && array[1]=="confirm" || (array[0]=="share_timeline" && array[1]=="ok")){
    		//成功分享
    		var code=$("#code").val();
    		if(!!code && $.trim(code)!=="" && !dataForWeixin.b){
    			dataForWeixin.b=true;
    			$("#p_success").css({"display":"block"});
    			$("#p_failed").css({"display":"none"});
    		}else{
    			$("#p_success").css({"display":"none"});
    			$("#p_failed").css({"display":"block"});
    		}
    		$Tencent.renderPopWin("p_result");
    	}
    }
};
function WeiXinShareInit(){
	var onBridgeReady=function(){
		WeixinJSBridge.call('showOptionMenu');
        WeixinJSBridge.call('hideToolbar');
        // 发送给好友;
        WeixinJSBridge.on('menu:share:appmessage', function(argv){
            WeixinJSBridge.invoke('sendAppMessage',{
                "appid":dataForWeixin.appId,
                "img_url":dataForWeixin.TLImg,
                "img_width":"150",
                "img_height":"150",
                "link":dataForWeixin.link,
                "desc":dataForWeixin.desc,
                "title":dataForWeixin.title
            }, function(res){
            	(dataForWeixin.callback)(res.err_msg);//.send_app_msg :cancel;confirm
            });
        });
        // 分享到朋友圈;
        WeixinJSBridge.on('menu:share:timeline', function(argv){
            //(dataForWeixin.callback)();
            WeixinJSBridge.invoke('shareTimeline',{
                "img_url":dataForWeixin.TLImg,
                "img_width":"150",
                "img_height":"150",
                "link":dataForWeixin.link,
                "desc":dataForWeixin.title,
                "title":dataForWeixin.desc
            },  function(res){
            	(dataForWeixin.callback)(res.err_msg);//.share_timeline cancel;ok
            });
        });
        // 分享到微博;
        WeixinJSBridge.on('menu:share:weibo', function(argv){
            WeixinJSBridge.invoke('shareWeibo',{
                "content":dataForWeixin.desc+" "+dataForWeixin.link,
                "url":dataForWeixin.link,
                "img_url":dataForWeixin.MsgImg,
                "pic":dataForWeixin.MsgImg,
                "img":dataForWeixin.MsgImg,
                "desc":dataForWeixin.desc,
                "title":dataForWeixin.title
            }, function(res){(dataForWeixin.callback)();});
        });
        // 分享facebook;
        WeixinJSBridge.on('menu:share:facebook', function(argv){
            (dataForWeixin.callback)();
            WeixinJSBridge.invoke('shareFB',{
                "img_url":dataForWeixin.TLImg,
                "img_width":"150",
                "img_height":"150",
                "link":dataForWeixin.link,
                "desc":dataForWeixin.desc,
                "title":dataForWeixin.title
            }, function(res){});
        });
    };
    if(document.addEventListener){
        document.addEventListener('WeixinJSBridgeReady', onBridgeReady, false);
    }else if(document.attachEvent){
        document.attachEvent('WeixinJSBridgeReady'   , onBridgeReady);
        document.attachEvent('onWeixinJSBridgeReady' , onBridgeReady);
    }
}
function shareModel(){
	var ua=navigator.userAgent;
	//微信
	if(ua.indexOf("MicroMessenger")>=0){
		WeiXinShareInit();
	}else{
		var _link = dataForWeixin.link,
			title = dataForWeixin.title,
			img=dataForWeixin.MsgImg,
			content = dataForWeixin.desc;
		//分享到腾讯微博
		window.open('http://share.v.t.qq.com/index.php?c=share&a=index&url='+encodeURIComponent(_link)+'&title='+encodeURIComponent(content)+'&pic='+encodeURIComponent(img)+'','_blank');
	}
}
function getWeishi(){
	$.ajax({
		"url":"http://wsi.weishi.com/weishi/video/downloadVideo.php?device=1&vid=1008_c6e6bd5b6acc4c4992ed4601cae697fd&id=2002056041308343",
		"dataType":"jsonp",
		"type":"GET",
		success:function(r){
			if(!!r && r.ret==0 && !!r.data && !!r.data.url && !!r.data.url[0]){
				$("#btn_weishi").attr("href",r.data.url[0]);
			}else{
				$("#btn_weishi").attr("href","javascript:;");
			}
		},
		error:function(a,b,c){
			$("#btn_weishi").attr("href","javascript:;");
		}
	});
}
function getVideo(callback){
  var video="h0146mf5xpg";
  window.QZOutputJson=null;
  //alert("视频"+(idx+1));
  $.ajax({
    url:"http://vv.video.qq.com/geturl?otype=json&vid="+video,
    dataType:"jsonp",
    type:"GET",
    success:function(r){
      if(!!r && !!r.vd && !!r.vd.vi && !!r.vd.vi[0]){
        var url=r.vd.vi[0]["url"];
        $(".btn_1").attr("href",url); //设置点击按钮 A 标签的 href
        // var videoObj=document.getElementById("tenvideo");
        // videoObj.src=( url || "");
        // //typeof(videoObj.load)=='function' && videoObj.load();
        // typeof(callback)=='function' && callback();
      }
    }
  });
}
jQuery.extend( jQuery.easing,
{
	def: 'easeOutQuad',
	swing: function (x, t, b, c, d) {
		//alert(jQuery.easing.default);
		return jQuery.easing[jQuery.easing.def](x, t, b, c, d);
	},
	easeInQuad: function (x, t, b, c, d,s) {
		return c*(t/=d)*t + b;
	},
	easeOutQuad: function (x, t, b, c, d) {
		return -c *(t/=d)*(t-2) + b;
	},
	easeOutCubic: function (x, t, b, c, d) {
		return c*((t=t/d-1)*t*t + 1) + b;
	},
	easeInOutQuad: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t + b;
		return -c/2 * ((--t)*(t-2) - 1) + b;
	},
	easeOutBack: function (x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
	}
});

/*	简单的 图片资源加载器
 *	@param {String | Array} property 准备加载的图片或图片资源队列
 *	
 *	Public Function | Interface
 *		func completed	{Interface}		加载完成后回调(包含加载失败的情况) 请覆盖实现
 *			@param	{Integer}	arg1	加载资源总数
 *			@param	{Integer}	arg2	加载成功数量
 *			@param	{Integer}	arg3	加载失败数量
 *
 *		func progress	{Interface}		加载进度回调 请覆盖实现
 *			@param	{Integer}	arg1	加载资源总数
 *			@param	{Integer}	arg2	当前加载成功数量
 *			@param	{Integer}	arg3	当前加载失败数量
 *
 *		func start 		{Main Function}	开始执行加载
 *			return {Object}	assets 返回图片资源列表 及状态(assets[img].loaded)
 *	
 *	Property
 *		assets	{Object}	加载资源列表(含加载状态。不论是否加载成功)
 *		asset 	{Object}	加载成功 资源列表
 *
 */
function ImgLoader(property){
	var onloadedcompleted	,// 加载完成回调
		onloading			,// 加载进度回调
		NUM_ELEMENTS		,// 资源总数
		NUM_LOADED = 0		,// 已加载数量
		NUM_ERROR = 0		,// 加载错误数量
		TempProperty = {}	,// 资源列表
		LOADED_THEMES={}	,// 加载成功的资源
		loadList = [] 		;// 加载队列

	//初始化参数
	if(typeof(property) == 'string'){
		NUM_ELEMENTS=1;
		loadList[0]=property;
	}else{
		NUM_ELEMENTS=property.length;
		loadList=property;
	}
	//资源存储位置
	this.assets=TempProperty;//对象引用
	this.asset=LOADED_THEMES;
	//初始化回调函数
	this.completed=function(callback){
		onloadedcompleted=callback;
	};
	this.progress=function(callback){
		onloading=callback;
	};
	this.start=function(){
		for(var i=0;i<NUM_ELEMENTS;i++){
			load(loadList[i],imageLoaded,imageLoadError);
		}
		return TempProperty;
	};
	function load(img,loaded,error){
		//存储资源引用
		var image=new Image();
		image.onload=loaded;
		image.onerror=error;
		image.src=img;
		TempProperty[img]=image;
	};
	function imageLoaded(){
		var imgsrc=this.getAttribute("src");
		TempProperty[imgsrc].loaded=true;
		NUM_LOADED++;
		
		if(NUM_LOADED+NUM_ERROR==NUM_ELEMENTS){
			//加载完毕 则调用completed
			typeof(onloadedcompleted) =='function' && onloadedcompleted(NUM_ELEMENTS,NUM_LOADED,NUM_ERROR);
		}else{
			//加载进行中...调用 onloading
			typeof(onloading) =='function' && onloading(NUM_ELEMENTS,NUM_LOADED,NUM_ERROR);
		}
	};
	function imageLoadError(){
		var imgsrc=this.getAttribute("src");
		TempProperty[imgsrc].loaded=false;
		NUM_ERROR++;
		//加载错误后需要继续处理...
		if(NUM_LOADED+NUM_ERROR==NUM_ELEMENTS){
			//加载完毕 则调用completed
			typeof(onloadedcompleted) =='function' && onloadedcompleted(NUM_ELEMENTS,NUM_LOADED,NUM_ERROR);
		}else{
			//加载进行中...调用 onloading
			typeof(onloading) =='function' && onloading(NUM_ELEMENTS,NUM_LOADED,NUM_ERROR);
		}
	};
};
// 使用方式
// var imgArray=[......];//图片资源数组
// var imgLoader=new ImgLoader(imgArray); //初始化加载器
// //定义加载过程中的处理方法
// imgLoader.progress(function(a,b,c){
// 	//a:加载总数
// 	//b:加载成功数
// 	//c:加载失败数
// });
// //定义加载完成时的处理方法
// imgLoader.completed(function(a,b,c){
// 	//a:加载总数
// 	//b:加载成功数
// 	//c:加载失败数
// });
// //定义完后开始执行加载
// imgLoader.start();

$Tencent=window.$Tencent || {
	viewport:{w:0,h:0,scale:1,scaleX:1,scaleY:1,cur:-1},
	$bath:".",//
	getVendorPrefix:function() {
		var property = {
			transformProperty : '',
			MozTransform : '-moz-',
			WebkitTransform : '-webkit-',
			OTransform : '-o-',
			msTransform : '-ms-'
		};
		var m_style=document.documentElement.style;
		for (var p in property) {
			if (typeof m_style[p] != 'undefined') {
				return property[p];
			}
		}
		return "";
	},
	getJSONLength:function(json){
		var temp=0;
		for(var val in json){
			temp++;
		}
		return temp;
	},
	hasMusic:false,
	playMusic:function(isZero){
		if($("#btn_voice").hasClass("iscontrol")){return;}
		var music=document.getElementById("BGM");
		if(!!music && !!isZero && music.currentTime!=0){
			music.currentTime=0;
		}
		typeof(music.play)=='function' && music.play();
		if(!!music.paused){
			$("#btn_voice").removeClass("beplay");
		}else{
			$("#btn_voice").addClass("beplay");
		}
	},
	pauseMusic:function(){
		if($("#btn_voice").hasClass("iscontrol")){return;}
		var music=document.getElementById("BGM");
		typeof(music.pause)=='function' && music.pause();
		if(!!music.paused){
			$("#btn_voice").removeClass("beplay");
		}else{
			$("#btn_voice").addClass("beplay");
		}
	},
	resizeHandler:function(){
		var _=$Tencent;
		var ww=window.innerWidth,
			wh=window.innerHeight;
		$("#main").css({"height":(750/ww)*wh,"scale":ww/750});

		_.viewport.scaleY=wh/1206;
		_.viewport.scaleX=ww/750;
		//page2 line
		if(wh>=720){
			$("#page_2 .line").css({"height":wh/2-360});
		}

		//page6 resize
		if(wh>=1201){
			$("#page_6 .line").css({"height":wh/2-360});
		}else if(wh<=812){
			$("#page_6 .wrapper,#page_6 .film").css({"y":406-wh/2});
			if(wh<=736){
				$("#page_6 .txt").css({"y":wh/2-368});
			}else{
				$("#page_6 .txt").css({"y":0});
			}
			//媒体页面
			$("#p_media .p_content").css({"scale":wh/812});

		}else{
			$("#page_6 .wrapper,#page_6 .film").css({"y":0});
			$("#p_media .p_content").css({"scale":1});
		}

		//page7 resize
		if(wh<=1040){
			$("#page_7 .wrapper").css({"y":520-wh/2,"scale":(wh-485)/555});
		}else{
			$("#page_7 .wrapper").css({"y":0,"scale":1});
		}
		//page8 resize
		if(wh<=1090){
      var _wh=(750/ww)*wh;
			$("#page_8 .slogan").css({"scale":(_wh-827)/263});
			$("#page_8 .wrapper").css({"scale":(_wh-774)/316,"y":_wh-1090});
		}else{
			$("#page_8 .slogan,#page_8 .wrapper").css({"scale":1,"y":0});
		}
	},
	//页面切换
	locked:false,
	bgIdx:[0,1,2,1,1,1,0,1,2],
	mainPageSlider:function(c,t,beback){
		var _=this;
		if(_.locked){return;}
		_.locked=true;
		var pagecur=$(".page").index($(".page.cur"));
		c= c || (pagecur<=0? 0 : pagecur);
		if(c==t){_.locked=false;return;}
		if(t<0 || t>=$(".page").size()){_.locked=false;return;}
		if(beback==undefined || beback==null){beback=(c>t);}
		//console.log(c+"-->"+t);
		var $page=$(".page");
		var during =800;
		$page.eq(c).removeClass("cur").trigger("pageOut",beback,during);
		$page.eq(t).addClass("cur").attr("relindex",c).trigger("pageIn",beback,during);
		_.renderPagebg(_.bgIdx[t]);
		//_.viewport.cur=t;
		//适应页面高度
		window.scrollTo(0,0);
		setTimeout(function(){
			_.locked=false;
		},during);
	},
	renderPagebg:function(i){
		var c=$(".bgimg").index($(".bgimg.cur"));
		if(c==i) return;
		$(".bgimg.cur").stop().removeClass("cur").animate({"opacity":0},500,function(){
			$(this).css({"display":"none"});
		});
		$(".bgimg").eq(i).stop().addClass("cur").css({"display":"block","opacity":0}).animate({"opacity":1},500);
	},
	stopTransition:function(obj){
		var _=this;
		var $obj= !!obj.jquery ? obj :$(obj);
		$obj.css({"transition":"none 0s"});
		return $obj;
	},
	//弹层
	renderPopWin:function(id,during){
		var $win=$("#"+id);
		clearTimeout($win.attr("timeid"));
		//$win.css({"y":"100%","display":"block"}).transition({"y":"0%"},500,"out");
		$win.fadeIn(500);
		if(!!during){
			$win.attr("timeid",setTimeout(function(){
				// $win.transition({"y":"100%"},350,"in",function(){
				// 	$win.css({"display":"none"});
				// });
				$win.fadeOut(500);
			},during));
		}
	},
	//提示信息
	renderTips:function(msg,during){
		var $win=$("#p_tips");
		clearTimeout($win.attr("timeid"));
		$win.html(msg);
		$win.fadeIn(500);
		if(!!during){
			$win.attr("timeid",setTimeout(function(){
				$win.fadeOut(500);
			},during));
		}
	},
	closePopWin:function(id,callback){
		var $win=$("#"+id);
		clearTimeout($win.attr("timeid"));
		$win.fadeOut(500);
		typeof(callback)=='function' && callback();
	},
	clearTimer:function(page,isclear){
		var _=this;
		var $page= !!page.jquery ? page :$(page);
		var timer=$page.data('timer') || [];
		for(var i=0;i<timer.length;i++){
			clearTimeout(timer[i]);
		}
		if(!!isclear){
			$page.removeData("timer");
		}
	},
	setTimer:function(obj,newTimer){
		var _=this;
		var $obj= !!obj.jquery ? obj :$(obj);
		var timer=$obj.data('timer') || [];
		timer=timer.concat(newTimer);
		$obj.data('timer',timer);
	},
	huxi:function(obj,start,end,during,s1,s2,interval){
		var _=this;
		var $obj= !!obj.jquery ? obj :$(obj);
		var timer=[];
		if(start==undefined) start=0;
		if(end==undefined) end=1;
		if(s1==undefined) s1= start;
		if(s2==undefined) s2= end;

		_.clearTimer($obj);
		var settime=during || 1500;
		interval= interval || 500;
		//呼吸
		if($obj.hasClass("beopen")){
			$obj.removeClass("beopen").transition({"opacity":start,"scale":s1},settime);
			//settime+=1000;
		}else{
			$obj.addClass("beopen").transition({"opacity":end,"scale":s2},settime);
		}
		timer[0]=setTimeout(function(){
			_.huxi($obj,start,end,settime,s1,s2);
		},settime+interval);
		// $obj.data("timer",timer);
		_.setTimer($obj,timer);
	},
	loop:function(obj,start,end,during,interval,beback){
		var _=this;
		var $obj= !!obj.jquery ? obj :$(obj);
		var timer=[];
		if(start==undefined) start=-200;
		if(end==undefined) end=1;
		_.clearTimer($obj);
		during= during || 2500;
		interval = interval || 0;
		//线性运动，此处用 left
		$obj.stop().animate({"left":end},during,"linear");
		timer[0]=setTimeout(function(){
			if(!!beback){
				_.loop($obj,end,start,during,interval,beback);	
			}else{
				$obj.css({"left":start});
				_.loop($obj,start,end,during,interval,beback);
			}
		},during+interval);
		_.setTimer($obj,timer);
	},
	shake:function(obj,start,end,during,interval,type){
		var _=this;
		var $obj= !!obj.jquery ? obj :$(obj);
		var timer=[];
		if(start==undefined) start=-200;
		if(end==undefined) end=1;
		_.clearTimer($obj);
		during= during || 2500;
		interval = interval || 0;
		//线性运动，此处用 left
		$obj.stop().animate(type=="y"?{"top":end}:{"left":end},during,"linear");
		timer[0]=setTimeout(function(){
			_.shake($obj,end,start,during,interval,type);	
		},during+interval);
		_.setTimer($obj,timer);
	},
	autoWave:function($obj,during,cstep,dx,beback,typeShape,r,interval){
		var _=this;
		_.clearTimer($obj);
		interval= interval ||0;
		var timer=[];
		var pertime=10;
		var steps=parseInt(during/pertime);
		dx =dx|| 1;
		cstep= cstep || (!!beback? steps :1);
		var posx=dx*cstep/steps;
		var posy=posx;
		switch(typeShape){
			case "circle":
				r= r || 5;
				if(posx>=2*r){
					posx=4*r-posx;
					posy=Math.sqrt(r*r-posx*posx);
				}else{
					posy=-Math.sqrt(r*r-posx*posx);
				}
				break;
			default:
				posx=dx*cstep/steps;
				posy=Math.sin(cstep/steps*Math.PI*2)*dx/2;
				break;
		}
		//if(!!$obj.attr("notwave")){return;}
		$obj.transition({"x":posx,"y":posy},pertime,"linear");
		if(!!beback){
			if(cstep>1){
				//console.log(posx+"true===========");
				timer[0]=setTimeout(function(){
					_.autoWave($obj,during,cstep-1,dx,true,typeShape,r);
				},pertime);
			}else{
				//console.log(dx+"true===========");
				_.autoWave($obj,during,null,dx,false,typeShape,r);
			}
		}else{
			if(cstep<steps){
				timer[0]=setTimeout(function(){
					_.autoWave($obj,during,cstep+1,dx,false,typeShape,r);
				},pertime);
			}else{
				//console.log(dx+" false===========");
				_.autoWave($obj,during,null,dx,true,typeShape,r);
			}
		}
		_.setTimer($obj,timer);
		return _;
	},
	clearAutoWave:function($obj){
		var _=this;
		$obj.each(function(i,e){
			_.clearTimer($(this));
		});
	},
	//视频按钮轮播
	videoSlider:function($obj,during){
		var _=this;
		var timer=[];
		_.clearTimer($obj,true);
		var $list=$obj.find(".vlist").stop();
		var $first=$list.slice(0,4);
		var idx=parseInt($list.last().attr("relidx")) || 1;
		var _new='';
		for(var i=1;i<=4;i++){
			var relidx=idx+i > 10 ? idx+i-10 : idx+i;
			_new+=('<div class="vlist vlist'+relidx+'" relidx="'+relidx+'"></div>');
		}
		var $new=$(_new);
		$obj.append($new.stop().css({"opacity":0,"scale":0.5}));
		$obj.stop().animate({"top":-335},500,function(){
			$first.remove();
			$(this).css({"top":-35});
			$new.each(function(i,elem){
				$(this).transition({"opacity":1,"scale":1},200+150*i);
			});
		});
		during= during ||0;
		timer[0]=setTimeout(function(){
			_.videoSlider($obj,during);
		},1000+during);
		_.setTimer($obj,timer);
		return _;
	},
	stopVideoSlider:function($obj){
		var _=this;
		var timer=[];
		_.clearTimer($obj,true);
		$obj.find(".vlist").stop().slice(6).remove();
		$obj.stop().css({"top":450});
		return _;
	},
	renderBulb:function(during,c,obj1,obj2,count,notLoop){
		var _=this;
		var $b1=obj1,
			$b2=obj2;
		_.clearTimer($b1,true);
		if($b1.hasClass("isshown")){
			$b1.removeClass("isshown").css({"display":"none"});
			if(!!$b2) $b2.css({"display":"block"});
		}else{
			if(!!$b2) $b2.css({"display":"none"});
			$b1.addClass("isshown").css({"display":"block"});
		}
		during= during || 0;
		var pertime=0;
		count = count || 6;
		var timer=[];
		var looped=true;
		c= c || 0;
		if(c+1>=count){
			pertime=during+3000;
			c=-1;
			looped= !notLoop;
		}else{
			pertime=during;
			looped=true;
		}
		if(looped){
			timer[0]=setTimeout(function(){
				_.renderBulb(during,c+1,obj1,obj2,count,notLoop);
			},pertime);
		}
		_.setTimer($b1,timer);
	},
	clearBulb:function(obj1,obj2){
		var _=this;
		var $b1=obj1,
			$b2=obj2;
		_.clearTimer($b1,true);
		$b1.removeClass("isshown").css({"display":"none"});
		if(!!$b2) $b2.css({"display":"none"});
	},
	shakeTimes:function(obj,start,end,c,during,count,type){
		var _=this;
		var $obj= !!obj.jquery ? obj :$(obj);
		var timer=[];
		if(start==undefined) start=-200;
		if(end==undefined) end=1;
		_.clearTimer($obj,true);
		during = during || 50;
		var interval =0;
		c = c || 0;
		if(c+1>=count){
			c=-1;
			interval=during+3000;
		}else{
			interval=during;
		}
		//线性运动，此处用 left
		$obj.stop().animate(type=="y"?{"top":end}:{"left":end},during,"linear");
		timer[0]=setTimeout(function(){
			_.shakeTimes($obj,end,start,c+1,during,count,type);	
		},interval);
		_.setTimer($obj,timer);
	},
	renderFilm:function(during){
		var _=this;
		var timer=[];
		var $list=$("#page_6 .piclist");
		var $bg=$("#page_6 .picbg");
		_.clearTimer($bg,true);
		// var interval=0;
		var s=$list.size();
		var c= $list.index($("#page_6 .piclist.cur"));
		var t= c+1 >=s? 0 : c+1;
		during = (during || 200);
		timer[0]=setTimeout(function(){
			if(c>=0){
				$list.eq(c).stop().removeClass("cur").animate({"opacity":0},during,function(){
					$(this).css({"display":"none"});
				});
				$bg.css({"display":"none"});
				// interval=50;
				if(c==5){
					_.clearTimer($list.eq(c).find(".innertxt"),true);
				}
			}
			if(t>=0){
				//timer[0]=setTimeout(function(){
					$list.eq(t).stop().addClass("cur").css({"display":"block","opacity":0}).animate({"opacity":1},during);
					$bg.css({"display":"block"});
				//},interval);
				if(t==5){
					_.shakeTimes($list.eq(t).find(".innertxt"),164,184,0,200,8,"x");
				}
			}
			_.renderFilm(during);
		},(c+1>=s?5000:500)+during);
		_.setTimer($bg,timer);
	},
	clearFilm:function(){
		var _=this;
		var timer=[];
		var $list=$("#page_6 .piclist");
		var $bg=$("#page_6 .picbg");
		_.clearTimer($bg,true);
		$list.stop().removeClass("cur").css({"display":"none"});
    $list.eq(4).addClass("cur").css({"display":"block"});
		$bg.css({"display":"none"});
	},
	renderTxt:function(){
		var _=this;
		var $txt=$("#page_8 .txtlist");
		var $light=$("#page_8 .light");
		var timer=[];
		var during=0;
		_.clearTimer($light,true);
		if($light.hasClass("isshown")){
			_.clearTxt();
			during=500;
		}else{
			$light.addClass("isshown").css({"display":"block"});
			$txt.each(function(i,elem){
				var $this=$(this);
				timer.push(setTimeout(function(){
					$this.stop().animate({"opacity":1},800);
				},i*300));
			});
			during=5000;
		}
		timer[4]=setTimeout(function(){
			_.renderTxt();
		},during);
		_.setTimer($light,timer);
	},
	clearTxt:function(){
		var _=this;
		var $txt=$("#page_8 .txtlist");
		var $light=$("#page_8 .light");
		_.clearTimer($light,true);
		$light.removeClass("isshown").css({"display":"none"});
		$txt.stop().css({"opacity":0});
	},
	eventPos:{
		firstTimer:1,
		touchTimes:0
	},
	pageTouchStart:function(e){
		var that=this;
		var _=$Tencent;
		e= e || window.event;
		_.eventPos.startX= !!e.changedTouches ? e.changedTouches[0].pageX:e.pageX;
        _.eventPos.startY= !!e.changedTouches ? e.changedTouches[0].pageY:e.pageY;
        _.eventPos.startTime=new Date().getTime();
        _.eventPos.endTime=0;
        if(_.eventPos.firstTimer==1){_.playMusic();}
        _.eventPos.firstTimer++;
	},
	pageTouchMove:function(e){
		var that=this;
		var _=$Tencent;
		e= e || window.event;
		_.eventPos.curX= !!e.changedTouches ? e.changedTouches[0].pageX:e.pageX;
        _.eventPos.curY= !!e.changedTouches ? e.changedTouches[0].pageY:e.pageY;
        _.eventPos.curTime=new Date().getTime();
	},
	pageTouchEnd:function(e){
		var that=this;
		var _=$Tencent;
		e= e || window.event;
		_.eventPos.endX= !!e.changedTouches ? e.changedTouches[0].pageX:e.pageX;
        _.eventPos.endY= !!e.changedTouches ? e.changedTouches[0].pageY:e.pageY;
        _.eventPos.endTime=new Date().getTime();
        var c=$(".page").index($(".page.cur"));
        var s=$(".page").size();
        var t;
        if(_.eventPos.endY-_.eventPos.startY >=50){ //向下滑动
        	t=c-1<=0? 0 : c-1;
        	_.mainPageSlider(c,t,true);
        }else if(_.eventPos.endY-_.eventPos.startY <=-50){//向上滑动
        	t=c+1 >= s ? s-1 : c+1;
        	_.mainPageSlider(c,t,false);
        }
        _.eventPos.startTime=0;
	},
	dotPos:[0,137,209,294,67,126,253],
	renderIntro:function(){
		var _=this;
		var $page=$("#intro");
		var timer=[];
		var cloudPos=[50,426,510];
		_.stopTransition($page.find(".wrapper")).css({"scale":1});
		$page.find(".txt").stop().css({"display":"block","opacity":0}).animate({"opacity":1},500);
		$page.find(".earth").transition({"scale":1},500);
		$page.find(".cloud").stop().animate({"opacity":1},500);
		timer[0]=setTimeout(function(){
			$page.find(".stars").each(function(i,elem){
				$(this).css({"display":"block","opacity":0});
				_.huxi($(this),0.5,1,1000+Math.floor(Math.random()*1000));
			});
			$page.find(".dotlist").stop().css({"display":"block","opacity":0}).each(function(i,elem){
				$(this).css({"top":-200}).animate({"top":_.dotPos[i],"opacity":1},200+Math.ceil(Math.random()*5)*100,"easeOutBack");
			});
			$page.find(".cloud").each(function(i,elem){
				_.loop($(this),cloudPos[i],cloudPos[i]+80,2000+Math.ceil(Math.random()*2000),0,true);
			});
		},500);
		timer[1]=setTimeout(function(){
			$page.find(".pad").css({"display":"block","opacity":0,"scale":0}).transition({"opacity":1,"scale":1},500);
			$page.find(".superstar1").stop().css({"display":"block","opacity":0}).animate({"opacity":1},350,function(){
				$(this).addClass("rotate-30");
			});
			$page.find(".superstar2").stop().css({"display":"block","opacity":0}).animate({"opacity":1},500,function(){
				//$(this).addClass("rotate-60");
			});
		},1000);
		_.setTimer($page,timer);
	},
	clearIntro:function(s){
		var _=this;
		var $page=$("#intro");
		_.clearTimer($page);
		$page.find(".txt").stop().animate({"opacity":0},!!s?10:500);
		_.stopTransition($page.find(".earth"));
		$page.find(".earth").css({"scale":0});
		$page.find(".stars").css({"opacity":0}).each(function(i,elem){
			_.clearTimer($(this));
		});
		$page.find(".dotlist").stop().animate({"top":-200,"opacity":0},!!s?10:500);
		//$page.find(".pad").stop().animate({"opacity":0},!!s?10:350);
		_.stopTransition($page.find(".pad")).css({"opacity":0,"scale":0});

		$page.find(".superstar1").stop().animate({"opacity":0},!!s?10:500,function(){
			$(this).removeClass("rotate-30");
		});
		$page.find(".superstar2").stop().animate({"opacity":0},!!s?10:500,function(){
			//$(this).removeClass("rotate-60");
		});
		//停止飘逸的云
		$page.find(".cloud").each(function(i,elem){
			_.clearTimer($(this));
			$(this).stop().css({"opacity":0});
		});
	},
	renderSun:function(){
		var _=this;
		var $page=$("#page_1");
		var timer=[];
		var during=1500;
		_.clearTimer($page);
		//背景
		//$page.find(".sunbg").stop().animate({"opacity":1},during);
		$(".moonbg").stop().animate({"opacity":0},during);
		//星星
		$page.find(".stars").css({"opacity":0}).each(function(i,elem){
			_.clearTimer($(this));
		});
		//屋子
		$page.find(".sun_island").stop().animate({"opacity":1},during);
		$page.find(".moon_island").stop().animate({"opacity":0},during);
		//云
		$page.find(".sun_cloud").stop().animate({"opacity":1},during);
		$page.find(".moon_cloud").stop().animate({"opacity":0},during);
		//太阳开始升起
		//_.stopTransition($page.find(".sun")).css({"rotate":-_.viewport.deg,"opacity":1}).transition({"rotate":_.viewport.deg},8000,"linear");
		$page.find(".sun").css({"rotate":-_.viewport.deg,"opacity":1}).transition({"rotate":_.viewport.deg},8000,"linear");
		timer[0]=setTimeout(function(){
			_.renderMoon();
		},7800);
		_.setTimer($page,timer);
	},
	renderMoon:function(){
		var _=this;
		var $page=$("#page_1");
		var timer=[];
		var during=1500;
		_.clearTimer($page);
		//背景
		//$page.find(".sunbg").stop().animate({"opacity":0},during);
		$(".moonbg").stop().animate({"opacity":1},during);
		//星星
		$page.find(".stars").each(function(i,elem){
			$(this).css({"display":"block","opacity":0});
			_.huxi($(this),0.3,1,1000+Math.floor(Math.random()*1000));
		});
		//屋子
		$page.find(".sun_island").stop().animate({"opacity":0},during);
		$page.find(".moon_island").stop().animate({"opacity":1},during);
		//云
		$page.find(".sun_cloud").stop().animate({"opacity":0},during);
		$page.find(".moon_cloud").stop().animate({"opacity":1},during);
		//月亮开始升起
		//_.stopTransition($page.find(".moon")).css({"rotate":-_.viewport.deg,"opacity":1}).transition({"rotate":_.viewport.deg},8000,"linear");
		$page.find(".moon").css({"rotate":-_.viewport.deg,"opacity":1}).transition({"rotate":_.viewport.deg},8000,"linear");
		timer[0]=setTimeout(function(){
			_.renderSun();
		},7800);
		_.setTimer($page,timer);
	},
	clearSunMoon:function(){
		var _=this;
		var $page=$("#page_1");
		_.clearTimer($page,true);
		_.stopTransition($page.find(".moon")).css({"rotate":-_.viewport.deg,"opacity":0});
		_.stopTransition($page.find(".sun")).css({"rotate":-_.viewport.deg,"opacity":0});
		//背景
		//$page.find(".sunbg").stop().css({"opacity":1});
		$(".moonbg").stop().animate({"opacity":0},500);
		//星星
		$page.find(".stars").css({"opacity":0}).each(function(i,elem){
			_.clearTimer($(this));
		});
		//屋子
		$page.find(".sun_island").stop().css({"opacity":1});
		$page.find(".moon_island").stop().css({"opacity":0});
		//云
		$page.find(".sun_cloud").stop().css({"opacity":1});
		$page.find(".moon_cloud").stop().css({"opacity":0});
	},
	eventInit:function(){
		var _=this;
		document.addEventListener('touchstart', function (e) { 
			//if(stopmove) 
			//e.preventDefault();
		},false);
		document.addEventListener('touchmove', function (e) { 
			//if(_.stopmove){
				e.preventDefault(); 
			// 	_.stopmove=false;
			// }
		},false);
		//禁止弹出选择菜单
		document.documentElement.style.webkitTouchCallout = "none";
		
		var page=document.getElementsByClassName("page");
		for(var i=0;i<page.length;i++){
			page.item(i).addEventListener("ontouchstart" in document ? "touchstart" : "mousedown",_.pageTouchStart,false);
			page.item(i).addEventListener("ontouchmove" in document ? "touchmove" : "mousemove",_.pageTouchMove,false);
			page.item(i).addEventListener("ontouchend" in document ? "touchend" : "mouseup",_.pageTouchEnd,false);
		}
		//向下翻页
		$("#btn_down").on("click",function(){
			var c=$(".page").index($(".page.cur"));
			c=Math.max(c,0);
	        var s=$(".page").size();
	        var t=c+1 >= s ? s-1 : c+1;
	        _.mainPageSlider(c,t,false);
		});
		//分享指示
		$(".btn_share").on("click",function(){
			$("#p_share").find(".p_sign").addClass("p_sign_am");
			_.renderPopWin("p_share",3500);
		});
		$("#p_share").on("click",function(){
			_.closePopWin("p_share",function(){
				$("#p_share").find(".p_sign").removeClass("p_sign_am");
			});
		});
		//合作媒体
		$(".btn_join").on("click",function(){
			_.renderPopWin("p_media");
		});
		$("#p_media .p_close").on("click",function(){
			_.closePopWin("p_media");
		});
		//抽奖结果
		$("#p_result .p_close").on("click",function(){
			_.closePopWin("p_result");
		});
		//提交QQ号码
		$("#btn_submit").on("click",function(){
      if($(this).hasClass("besubmit")){return;}
			var qq=$("#qqcode").val();
			var code=$("#code").val();
			if($.trim(code)==""){
				_.renderTips("非法请求！",2500);
				return;
			}
			if($.trim(qq)==""){
				_.renderTips("请输入QQ号码",2500);
				return;
			}
			//
      $(this).addClass("besubmit");
			$.ajax({
				url:"http://themoment.weishi.com/jieshao/commit",
				data:{"code":code,"qq":qq},
				dataType:"json",
				type:"POST",
				success:function(r){
					if(!!r && r.err==0){
						_.renderTips("QQ号提交成功",2500);
						_.closePopWin("p_result");
					}else{
						var msg=r.msg || "提交失败";
						_.renderTips(msg,2500);
					}
          $("#btn_submit").removeClass("besubmit");
				},
				error:function(a,b,c){
					_.renderTips("网络异常，请稍后重试",2500);
          $("#btn_submit").removeClass("besubmit");
				}
			});
		});

		//关闭浮层
		$(".p_close").on("click",function(){
			//
		});
		//音乐
		$("#btn_voice").on("click",function(){
			$(this).removeClass("iscontrol");
			if($(this).hasClass("beplay")){
				_.pauseMusic();
			}else{
				_.playMusic();
			}
			$(this).addClass("iscontrol");
		});

		//手机端不需要每次 resize 放到cssInit中初始化
		//$(window).on("resize",_.resizeHandler).trigger("resize");
		return _;
	},
	pageEventInit:function(){
		var _=this;
		$("#intro").on("pageIn",function(e,beback,timeline){
			var $page=$(this);
			timeline= timeline || 800;
			// if(!!beback){
			// 	$page.stop().css({"top":"0%","display":"block","opacity":0,"z-index":2})
			// 	.animate({"opacity":1},800,function(){
			// 		_.renderIntro();
			// 	});
			// 	$page.find(".wrapper").css({"scale":5}).transition({"scale":1},800);
			// }else{
			// 	$page.stop().css({"top":"0%","display":"block","opacity":0})
			// 	.animate({"opacity":1},800,function(){
			// 		_.renderIntro();
			// 	});
			// }
			$page.stop().css({"display":"block","y":!!beback?"-100%":"100%"}).transition({"y":"0%"},timeline,function(){
				_.renderIntro();
			});
		});
		$("#intro").on("pageOut",function(e,beback,timeline){
			var $page=$(this);
			timeline= timeline || 800;
			// if(!!beback){
			// 	_.clearIntro();
			// 	$page.stop().animate({"opacity":0},800,function(){
			// 		$(this).css({"display":"none","top":"100%"});
			// 	});
			// }else{
			// 	$page.stop().css({"z-index":2}).animate({"opacity":0},800,function(){
			// 		_.clearIntro(true);
			// 		$(this).css({"display":"none","top":"-100%","z-index":1});
			// 	});
			// 	$page.find(".wrapper").transition({"scale":5},800);
			// }
			$page.stop().transition({"y":!!beback?"100%":"-100%"},timeline,function(){
				_.clearIntro();
				$(this).css({"display":"none"});
			});
		});
		$("#page_1").on("pageIn",function(e,beback,timeline){
			var $page=$(this);
			timeline= timeline || 800;
			// if(!!beback){
			// 	$page.stop().css({"top":"-100%","display":"block","opacity":1})
			// 	.animate({"top":"0%"},800);
			// }else{
			// 	$page.stop().css({"top":"0%","display":"block","opacity":1});
			// }
			$page.stop().css({"display":"block","y":!!beback?"-100%":"100%"}).transition({"y":"0%"},timeline,function(){
				$page.find(".txt").stop().css({"display":"block","opacity":0}).animate({"opacity":1},500);
				$page.find(".island").stop().css({"display":"block","opacity":0,"top":!!beback?"40%":"60%"}).animate({"opacity":1,"top":"50%"},500);
			});
			_.renderSun(timeline);
			$page.find(".cloud").stop().animate({"opacity":1},timeline/2,function(){
				_.loop($page.find(".cloud_1"),85,140,2000+Math.ceil(Math.random()*2000),0,true);
				_.loop($page.find(".cloud_2"),310,350,2000+Math.ceil(Math.random()*2000),0,true);
				_.loop($page.find(".cloud_3"),590,540,2000+Math.ceil(Math.random()*2000),0,true);
			});
		});
		$("#page_1").on("pageOut",function(e,beback,timeline){
			var $page=$(this);
			timeline= timeline || 800;
			_.clearSunMoon();
			$page.stop().transition({"y":!!beback?"100%":"-100%"},timeline,function(){
				$page.find(".txt").stop().css({"opacity":0});
				$page.find(".island").stop().css({"opacity":0},500);
				$(this).css({"display":"none"});
			});
			//停止飘逸的云
			_.clearTimer($page.find(".cloud_1").stop().css({"opacity":0}));
			_.clearTimer($page.find(".cloud_2").stop().css({"opacity":0}));
			_.clearTimer($page.find(".cloud_3").stop().css({"opacity":0}));
		});
		$("#page_2").on("pageIn",function(e,beback,timeline){
			var $page=$(this);
			timeline= timeline || 800;
			//视频按钮
			$page.find(".vlists_ul").stop().animate({"top":-35},2000,function(){
				_.videoSlider($(this),1000);
			});
			$page.stop().css({"display":"block","y":!!beback?"-100%":"100%"}).transition({"y":"0%"},timeline,function(){
				//气球
				_.shake($(this).find(".qiqiu"),"40%","60%",4000,0,"y");
				//树
				$(this).find(".tree1,.tree3,.tree4").transition({"scale":1},400+Math.ceil(Math.random()*300));
				$(this).find(".txt").stop().css({"display":"block","opacity":0}).animate({"opacity":1},800);
			});
		});
		$("#page_2").on("pageOut",function(e,beback,timeline){
			var $page=$(this);
			timeline= timeline || 800;
			$page.stop().transition({"y":!!beback?"100%":"-100%"},timeline,function(){
				_.clearTimer($page.find(".qiqiu").stop().css({"top":"50%"}));
				_.stopTransition($(this).find(".tree1,.tree3,.tree4")).css({"scale":0});
				_.stopVideoSlider($(this).find(".vlists_ul"));
				$(this).find(".txt").stop().css({"opacity":0});
				$(this).css({"display":"none"});
			});
		});
		$("#page_3").on("pageIn",function(e,beback,timeline){
			var $page=$(this);
			timeline= timeline || 800;
			var timer=[];
			var $w1=$page.find(".wrapper_1"),
				$w2=$page.find(".wrapper_2");
			$page.stop().css({"display":"block","y":!!beback?"-100%":"100%"}).transition({"y":"0%"},timeline,function(){
				if(!!beback){
					//wrapper1
					$w1.transition({"scale":Math.min(_.viewport.scaleX,1)},500,function(){
						$w1.find(".hand").transition({"rotate":0,"opacity":1},500,function(){
							_.renderBulb(50,0,$("#page_3 .light").eq(0),$("#page_3 .light").eq(1),8,true);
							$w1.find(".txt").transition({"rotate":0,"opacity":1},500);
						});
					});
				}else{
					//wrapper2
					$w2.transition({"scale":Math.min(_.viewport.scaleX,1)},500,function(){
						$w2.find(".hand").transition({"rotate":0,"opacity":1},500,function(){
							$w2.find(".txt").transition({"rotate":0,"opacity":1},500);
						});
					});
				}
			});
			timer[0]=setTimeout(function(){
				if(!!beback){
					//wrapper2
					$w2.transition({"scale":Math.min(_.viewport.scaleX,1)},500,function(){
						$w2.find(".hand").transition({"rotate":0,"opacity":1},500,function(){
							$w2.find(".txt").transition({"rotate":0,"opacity":1},500);
						});
					});
				}else{
					//wrapper1
					$w1.transition({"scale":Math.min(_.viewport.scaleX,1)},500,function(){
						$w1.find(".hand").transition({"rotate":0,"opacity":1},500,function(){
							_.renderBulb(50,0,$("#page_3 .light").eq(0),$("#page_3 .light").eq(1),8,true);
							$w1.find(".txt").transition({"rotate":0,"opacity":1},500);
						});
					});
				}
			},timeline/2);
			_.setTimer($page,timer);
		});
		$("#page_3").on("pageOut",function(e,beback,timeline){
			var $page=$(this);
			timeline= timeline || 800;
			$page.stop().transition({"y":!!beback?"100%":"-100%"},timeline,function(){
				_.clearTimer($page,true);
				_.clearBulb($("#page_3 .light").eq(0),$("#page_3 .light").eq(1));
				var $w1=$page.find(".wrapper_1"),
					$w2=$page.find(".wrapper_2");
				_.stopTransition($page.find(".wrapper_1,.wrapper_2,.hand,.txt"));
				$w1.css({"scale":0});
				$w2.css({"scale":0});
				$w1.find(".hand").css({"rotate":20,"opacity":0});
				$w1.find(".txt").css({"rotate":5,"opacity":0});
				$w2.find(".hand").css({"rotate":-20,"opacity":0});
				$w2.find(".txt").css({"rotate":-5,"opacity":0});
				$(this).css({"display":"none"});
			});
		});
		$("#page_4").on("pageIn",function(e,beback,timeline){
			var $page=$(this);
			timeline= timeline || 800;
			var timer=[];
			var $w1=$page.find(".wrapper_1"),
				$w2=$page.find(".wrapper_2");
			var cloudPos=[33,310];
			$page.find(".cloud").each(function(i,elem){
				$(this).stop().animate({"opacity":1},400,function(){
					_.loop($(this),cloudPos[i],cloudPos[i]+40,2000+Math.ceil(Math.random()*1000),0,true);
				});
			});
			$page.stop().css({"display":"block","y":!!beback?"-100%":"100%"}).transition({"y":"0%"},timeline,function(){
				if(!!beback){
					//wrapper1
					$w1.transition({"scale":Math.min(_.viewport.scaleX,1)},500,function(){
						$w1.find(".light1").transition({"scale":1,"opacity":1},400,function(){
							$(this).addClass("wave1");
						});
						$w1.find(".light2").transition({"scale":1,"opacity":1},600,function(){
							$(this).addClass("wave2");
						});
						$w1.find(".txt").transition({"x":0,"opacity":1},800);
					});
				}else{
					//wrapper2
					$w2.transition({"scale":Math.min(_.viewport.scaleX,1)},500,function(){
						$w2.find(".light3").transition({"scale":1,"opacity":1,"rotate":0},500,function(){
							$w2.find(".light4").transition({"scale":1,"opacity":1,"rotate":0},500);
						});
						$w2.find(".txt").transition({"x":0,"opacity":1},800);
					});
				}
			});
			timer[0]=setTimeout(function(){
				if(!!beback){
					//wrapper2
					$w2.transition({"scale":Math.min(_.viewport.scaleX,1)},500,function(){
						$w2.find(".light3").transition({"scale":1,"opacity":1,"rotate":0},500,function(){
							$w2.find(".light4").transition({"scale":1,"opacity":1,"rotate":0},500);
						});
						$w2.find(".txt").transition({"x":0,"opacity":1},800);
					});
				}else{
					//wrapper1
					$w1.transition({"scale":Math.min(_.viewport.scaleX,1)},500,function(){
						$w1.find(".light1").transition({"scale":1,"opacity":1},400,function(){
							$(this).addClass("wave1");
						});
						$w1.find(".light2").transition({"scale":1,"opacity":1},600,function(){
							$(this).addClass("wave2");
						});
						$w1.find(".txt").transition({"x":0,"opacity":1},800);
					});
				}
			},timeline/2);
			_.setTimer($page,timer);
		});
		$("#page_4").on("pageOut",function(e,beback,timeline){
			var $page=$(this);
			timeline= timeline || 800;
			//停止飘逸的云
			$page.find(".cloud").each(function(i,elem){
				_.clearTimer($(this));
				$(this).stop().css({"opacity":0});
			});
			$page.stop().transition({"y":!!beback?"100%":"-100%"},timeline,function(){
				_.clearTimer($page,true);
				var $w1=$page.find(".wrapper_1"),
					$w2=$page.find(".wrapper_2");
				_.stopTransition($page.find(".wrapper_1,.wrapper_2,.light,.txt"));
				$w1.css({"scale":0});
				$w2.css({"scale":0});
				$w1.find(".light").removeClass("wave1 wave2").css({"rotate":0,"opacity":0,"scale":0});
				$w2.find(".light").css({"rotate":90,"opacity":0,"scale":1.5});
				$w1.find(".txt").css({"x":-170,"opacity":0});
				$w2.find(".txt").css({"x":40,"opacity":0});
				$(this).css({"display":"none"});
			});
		});
		$("#page_5").on("pageIn",function(e,beback,timeline){
			var $page=$(this);
			timeline= timeline || 800;
			var timer=[];
			$page.stop().css({"display":"block","y":!!beback?"-100%":"100%"}).transition({"y":"0%"},timeline,function(){
				$(this).find(".txt").stop().css({"margin-top":!!beback?0:-300}).animate({"margin-top":147,"opacity":1},1000);
			});
			timer[0]=setTimeout(function(){
				$page.find(".wrapper").stop().animate({"width":408,"height":408,"margin-top":-306,"margin-left":-204},800,"linear",function(){
					$(this).css({"overflow":"visible"});
					_.renderBulb(100,0,$(this).find(".cat"),null,6);
					$(this).find(".win").stop().animate({"opacity":1},1500);
					$(this).find(".moon").stop().animate({"opacity":1,"margin-left":30,"margin-top":-245},1500);
          $page.find(".stars").each(function(i,elem){
            _.huxi($(this),0.5,1,1000+Math.floor(Math.random()*1000));
          });
				});
			},timeline/2 +100);
			_.setTimer($page,timer);
		});
		$("#page_5").on("pageOut",function(e,beback,timeline){
			var $page=$(this);
			timeline= timeline || 800;
			$page.stop().transition({"y":!!beback?"100%":"-100%"},timeline,function(){
				_.clearTimer($(this),true);
				$(this).css({"display":"none"});
				_.clearBulb($(this).find(".cat"),null);
				$(this).find(".txt").stop().css({"opacity":0});
				$(this).find(".wrapper").stop().css({"width":0,"height":0,"margin-left":0,"margin-top":-102,"overflow":"hidden"});
				$(this).find(".win").stop().css({"opacity":0});
				$(this).find(".moon").stop().css({"opacity":0,"margin-left":-110,"margin-top":-190});

			});
			$page.find(".stars").css({"opacity":0}).each(function(i,elem){
				_.clearTimer($(this));
			});
		});
		$("#page_6").on("pageIn",function(e,beback,timeline){
			var $page=$(this);
			timeline= timeline || 800;
			var timer=[];
			$page.stop().css({"display":"block","y":!!beback?"-100%":"100%"}).transition({"y":"0%"},timeline,function(){
				$(this).find(".txt").stop().css({"margin-top":!!beback?0:-300}).animate({"margin-top":147,"opacity":1},1000);
				$page.find(".film").stop().animate({"left":"50%"},800,"easeOutCubic",function(){
					$page.find(".wrapper").stop().animate({"width":438,"height":438,"margin-top":-401,"margin-left":-219},800);
				});
			});
			timer[0]=setTimeout(function(){
				_.renderFilm(200);
			},1600+timeline);
			_.setTimer($page,timer);
		});
		$("#page_6").on("pageOut",function(e,beback,timeline){
			var $page=$(this);
			timeline= timeline || 800;
			$page.stop().transition({"y":!!beback?"100%":"-100%"},timeline,function(){
				_.clearTimer($(this),true);
				$(this).css({"display":"none"});
				$(this).find(".txt").stop().css({"opacity":0});
				$(this).find(".film").stop().css({"left":"-50%"});
				_.clearFilm();
				$(this).find(".wrapper").stop().css({"width":0,"height":0,"margin-left":0,"margin-top":-182});
			});
		});
		$("#page_7").on("pageIn",function(e,beback,timeline){
			var $page=$(this);
			timeline= timeline || 800;
			var timer=[];
			$page.stop().css({"display":"block","y":!!beback?"-100%":"100%"}).transition({"y":"0%"},timeline,function(){
				$(this).find(".txt").stop().css({"top":!!beback?0:220}).animate({"top":110,"opacity":1},800);
				$(this).find(".items").each(function(i,elem){
					var $this=$(this);
					timer.push(setTimeout(function(){
						$this.transition({"x":0,"opacity":1},800,"easeOutBack");
					},1000-i*100));
				});
			});
			timer[6]=setTimeout(function(){
				$page.find(".crown").transition({"x":0,"y":0,"scale":1},1000,function(){
					//shakeTimes:function(obj,start,end,c,during,count,type){
					_.shakeTimes($(this),0,-30,0,200,6,"y");
				});
			},1000+timeline);
			_.setTimer($page,timer);
		});
		$("#page_7").on("pageOut",function(e,beback,timeline){
			var $page=$(this);
			timeline= timeline || 800;
			$page.stop().transition({"y":!!beback?"100%":"-100%"},timeline,function(){
				_.clearTimer($(this),true);
				$(this).css({"display":"none"});
				$(this).find(".txt").stop().css({"opacity":0});
				_.stopTransition($(this).find(".items")).css({"x":-400,"opacity":0});
				_.stopTransition($page.find(".crown").stop()).css({"x":30,"y":265,"scale":0,"top":0});
			});
		});
		$("#page_8").on("pageIn",function(e,beback,timeline){
			var $page=$(this);
			timeline= timeline || 800;
			var timer=[];
			$("#btn_down").fadeOut(200);
			$page.stop().css({"display":"block","y":!!beback?"-100%":"100%"}).transition({"y":"0%"},timeline,function(){
				$(this).find(".btn_1,.btn_share,.btn_join").stop().animate({"opacity":1},500);
			});
			timer[0]=setTimeout(function(){
				$page.find(".slogan,.wrapper").stop().animate({"opacity":1},500);
			},timeline/2);
			timer[1]=setTimeout(function(){
				$page.find(".yuan1").addClass("rotate-3");
				$page.find(".yuan2").addClass("rotate-5");
				$page.find(".yuan3").addClass("rotate-1");
				//_.renderTxt();
				//_.renderBulb(200,0,$page.find(".light"),null,10);
				_.huxi($page.find(".light"),0.5,1,100,1,1,100);
				//_.autoWave($page.find(".innerbtn2"),500,1,50,true,"circle",25);
				//loop:function(obj,start,end,during,interval,beback){
				_.loop($page.find(".innerbtn2"),443,490,1000,0,true);
			},timeline+100);

			$page.find(".txtlist").each(function(i,elem){
				var $this=$(this);
				timer.push(setTimeout(function(){
					$this.stop().animate({"opacity":1},800);
				},i*300+timeline+100));
			});
			_.setTimer($page,timer);
		});
		$("#page_8").on("pageOut",function(e,beback,timeline){
			var $page=$(this);
			timeline= timeline || 800;
			$("#btn_down").fadeIn(200);
			$page.stop().transition({"y":!!beback?"100%":"-100%"},timeline,function(){
				_.clearTimer($(this),true);
				$(this).find(".btn_1,.btn_share,.btn_join,.slogan,.wrapper").stop().css({"opacity":0});
				$page.find(".yuan1").removeClass("rotate-3");
				$page.find(".yuan2").removeClass("rotate-5");
				$page.find(".yuan3").removeClass("rotate-1");
				//_.clearTxt();
				//_.clearBulb($page.find(".light"),null);
				_.clearTimer($page.find(".light"));
				_.clearTimer($page.find(".innerbtn2"));
				$page.find(".txtlist").stop().css({"opacity":0});
				$(this).css({"display":"none"});
			});
		});
		return _;
	},
	cssInit:function(){
		var _=this;
		_.viewport.w=window.innerWidth;
		_.viewport.h=window.innerHeight;
		_.viewport.deg=Math.asin((_.viewport.w*0.5+110)/600)*180/Math.PI;
		//初始化 resize
		//手机端 不需要触发resize事件
		_.resizeHandler();
		//横竖屏幕
		window.addEventListener("onorientationchange" in window ? "orientationchange" : "resize", function(){
			if(window.orientation!=0){
				//_.renderShuping();
			}else{
				//_.closeShuping();
			}
		}, false);
		//检测重力，触发music Load
		// window.ondeviceorientation=function(e){
		// 	if(_.hasMusic){return;}
		// 	_.hasMusic=true;
		// 	_.playMusic();
		// }
		window.onunload=function(){
			$localStorage.setData("hashval",_.viewport.cur,true);
		};
    $("#page_5 .wrapper").prepend('<div class="innerview" style="position:absolute;width:408px;height:408px;left:50%;margin-left:-204px;top:50%;margin-top: -204px;overflow:hidden;"></div>');
    $("#page_5 .innerview").append($("#page_5 .stars,#page_5 .win,#page_5 .cat"));

		return _;
	},
	init:function(index){
		var _=this;
		window.scrollTo(0,0);
		WeiXinShareInit();
		_.cssInit().eventInit().pageEventInit();
		getWeishi();
    getVideo();
		if(index==undefined || index==null){index=-1};
		if(index>=0){
			_.renderPagebg(index);
			$("#loader").remove();
			_.playMusic();
			$(".page").eq(index).addClass("cur").trigger("pageIn",false,20);
		}else{
			_.loadingPage();
		}
		return _;
	},
	loadingPage:function(){
		var _=this;
		var assets=[
			"images/bg0.jpg","images/bg1.jpg","images/bg1.2.jpg","images/bg2.jpg",
			
			"images/cloud1.png","images/cloud2.png","images/cloud3.png",
			"images/cloud11.png","images/cloud12.png","images/cloud13.png",
			"images/txt1.png","images/txt2.png",

			"images/home/earth.png","images/home/star1.png","images/home/star2.png",
			"images/home/star3.png","images/home/star4.png",
			"images/home/star5.png","images/home/star6.png",
			"images/home/pad.png","images/home/dot.png",

			"images/p1/star7.png","images/p1/star8.png",
			"images/p1/sun.png","images/p1/moon.png","images/p1/island1.png","images/p1/island2.png",

			"images/p2/balloon.png","images/p2/video.png","images/p2/phone.png","images/p2/line1.png",
			"images/p2/bar1.png","images/p2/bar2.png","images/p2/bar3.png",
			"images/p2/tree1.png","images/p2/tree2.png","images/p2/tree3.png",

			"images/p3/circle.png","images/p3/hand1.png","images/p3/hand2.png",
			"images/p3/bulb1.png","images/p3/bulb2.png","images/p3/line2.png",
			"images/p3/txt4.1.png","images/p3/txt4.2.png",

			"images/p4/circle.png","images/p4/photo1.png","images/p4/photo2.png",
			"images/p4/line3.png","images/p4/txt5.1.png","images/p4/txt5.2.png",
			"images/p4/balloon.png","images/p4/balloon1.png","images/p4/balloon2.png",

			"images/p5/circle.png","images/p5/line4.png","images/p5/txt6.png","images/p5/win.png","images/p5/cat.jpg",

			"images/p6/circle.png","images/p6/film.png","images/p6/guang.png","images/p6/line5.png",
			"images/p6/pic1.jpg","images/p6/pic2.jpg","images/p6/pic3.jpg",
			"images/p6/pic4.jpg","images/p6/pic5.jpg","images/p6/pic6.jpg",
			"images/p6/txt.png",

			"images/p7/phone1.png","images/p7/phone2.png","images/p7/phone3.png",
			"images/p7/hill.png","images/p7/txt.png","images/p7/crown.png",

			"images/p8/p1.png","images/p8/txt2.png","images/p8/txt3.png","images/p8/txt4.png","images/p8/txt5.png",
			"images/p8/logo1.png","images/p8/logo2.png",
			"images/p8/btn1.png","images/p8/btn2.png","images/p8/btn3.png",
			"images/p8/btn1a.png","images/p8/btn1b.png","images/p8/light.png",

			"images/pop/media.png","images/pop/bg.png","images/pop/submit.png"

		];
		var imgLoad=new ImgLoader(assets);
		imgLoad.progress(function(a,b,c){
			var count=Math.round((b+c)*100/(a||1));
			$("#loadprogress").html(count+"%");
		});
		imgLoad.completed(function(){
			$("#loadprogress").html("100%");//.fadeOut(300);
			$("#btn_down").fadeIn(800);
			$("#intro").addClass("cur").trigger("pageIn",false);
			$("#loader").transition({"opacity":0},800,function(){//"scale":5,
				_.playMusic();
				$(this).remove();
			});
		});
		imgLoad.start();
		return _;
	},
	assets:null,
	loadImg:function(obj){
		var assets=[];
		var $obj= !!obj.jquery ? obj : $(obj);
		var id=$obj.attr("id");
		var data=itemConfig[id];
		if(!data || !data.length){return;}
		for(var i=0;i<data.length;i++){
			assets.push(data[i].img);
		}
		var imgLoad=new ImgLoader(assets);
		imgLoad.completed(function(){
			$obj.addClass("isloaded");
		});
		imgLoad.start();
	}
};
$(function(){
  var gloableval=$localStorage.getData("hashval",true);
	$Tencent.init(gloableval);
});