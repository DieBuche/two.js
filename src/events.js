// Events

// A module that can be mixed in to *any object* in order to provide it with
// custom events. You may bind with `on` or remove with `off` callback
// functions to an event; `trigger`-ing an event fires all callbacks in
// succession.
//
//     var object = {};
//     _.extend(object, Two.Events);
//     object.on('expand', function(){ alert('expanded'); });
//     object.trigger('expand');

(function(Two) {
  "use strict";

  var Events = Two.Events = {

      // Bind an event to a callback function.
      on: function(name, callback) {
        this._events = this._events || {};
        this._events[name] = this._events[name] || [];
        this._events[name].push(callback);
        return this;
      },

      // Iterates through listeners of events and invokes the callbacks,
      // passing on any optional arguments.
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

      // Removes the passed listener from an event
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

})(Two);
