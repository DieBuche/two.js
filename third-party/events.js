/**
 * The Events module pulled from [Backbone.js](http://backbonejs.org/)
 * Stripped and modified to work with node.js and optimize types of calls
 * for animation based events.
 */

var Backbone = Backbone || {};

(function() {

  var slice = Array.prototype.slice;

  // Backbone.Events
  // ---------------

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback
  // functions to an event; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //

  var argsToArrayStripFirst = function() {
    var l = arguments.length,
        args = new Array(l && l - 1);
    for (var i = 2; i < l; i++) args[i - 2] = arguments[i];
    return args;
  };


  var Events = Backbone.Events = {
      // Bind an event to a `callback` function.
      on: function(name, callback) {
        this._events = this._events || {};
        this._events[name] = this._events[name] || [];
        this._events[name].push(callback);
        return this;
      },

      // Iterates through listeners of events and invokes callback,
      // passing optional arguments.
      trigger: function(name) {
        if (this._events && this._events[name]) {
          var theseEvents = this._events[name];
          var args = (arguments.length > 1) ? arguments[1] : [];

          var i = theseEvents.length;
          while (i--) {
            theseEvents[i].apply(this, args);
          }
        }
        return this;
      },

      // Removes listener from event its handle was assigned to
      off: function(name, callback) {
        if (this._events[name]) {
          name = this._events[name];

          var i = name.length;
          while (i--) if (name[i] === callback) name.splice(i - 1, 1);
        } else if (arguments.length === 0) {
          this._events = {};
        }
        return this;
      }
  };


  // Aliases for backwards compatibility.
  Events.bind   = Events.on;
  Events.unbind = Events.off;

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = Events;
    }
    exports.Backbone = exports.Backbone || Backbone;
  }

})();
