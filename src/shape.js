(function(Two) {
  "use strict";

  var Shape = Two.Shape = function() {

    // Private object for renderer specific variables.
    this._renderer = {};

    this.id = Two.Identifier + Two.uniqueId();
    this.classList = [];

    // Define matrix properties which all inherited
    // objects of Shape have.

    this._matrix = new Two.Matrix();

    this.translation = new Two.Vector();
    this.translation.on(Two.Events.change, Shape.FlagMatrix.bind(this));
    this.rotation = 0;
    this.scale = 1;

  };

  _.extend(Shape, Two.Event, {

    FlagMatrix: function() {
      this._flagMatrix = true;
    },

    MakeObservable: function(object) {

      Object.defineProperty(object, 'rotation', {
        get: function() {
          return this._rotation;
        },
        set: function(v) {
          this._rotation = v;
          this._flagMatrix = true;
        }
      });

      Object.defineProperty(object, 'scale', {
        get: function() {
          return this._scale;
        },
        set: function(v) {
          this._scale = v;
          this._flagMatrix = true;
          this._flagScale = true;
        }
      });

    }

  });

  _.extend(Shape.prototype, {

    // Flags

    _flagMatrix: true,

    // Underlying Properties

    _rotation: 0,
    _scale: 1,

    addTo: function(group) {
      group.add(this);
      return this;
    },

    clone: function() {
      var clone = new Shape();
      clone.translation.copy(this.translation);
      clone.rotation = this.rotation;
      clone.scale = this.scale;
      _.each(Shape.Properties, function(k) {
        clone[k] = this[k];
      }, this);
      return clone._update();
    },

    /**
     * Set the parent of this object to another object
     * and updates parent-child relationships
     * Calling with no arguments will simply remove the parenting
     */
    replaceParent: function(newParent) {
        var id = this.id, oldParent = this.parent, index;

        // Release object from previous parent.
        if (oldParent) {
          index = oldParent.children.indexOf(this);
          if (index >= 0) {
            oldParent.children.splice(index, 1);
            delete this.parent;
          }

          index = oldParent.additions.indexOf(this);

          // If it's in additions it has just been added
          // and not processed it.
          // If not add it to substractions.
          if (index >= 0) {
            oldParent.additions.splice(index, 1);
          } else {
            oldParent.subtractions.push(this);
            oldParent._flagSubtractions = true;
          }
        }

        // If newParent is specified, add this to the group
        if (newParent) {
          newParent.children.push(this);
          this.parent = newParent;
          newParent.additions.push(this);
          newParent._flagAdditions = true;
        }

        return this;
    },

    /**
     * To be called before render that calculates and collates all information
     * to be as up-to-date as possible for the render. Called once a frame.
     */
    _update: function(deep) {

      if (!this._matrix.manual && this._flagMatrix) {
        this._matrix
          .identity()
          .translate(this.translation.x, this.translation.y)
          .scale(this.scale)
          .rotate(this.rotation);

      }

      if (deep) {
        // Bubble up to parents mainly for `getBoundingClientRect` method.
        if (this.parent && this.parent._update) {
          this.parent._update();
        }
      }

      return this;

    },

    flagReset: function() {

      this._flagMatrix = false;
      this._flagScale = false;

      return this;

    }

  });

  Shape.MakeObservable(Shape.prototype);

})(Two);
