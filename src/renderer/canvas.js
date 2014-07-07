(function(Two) {

  /**
   * Constants
   */
  var mod = Two.Utils.mod, toFixed = Two.Utils.toFixed;
  var getRatio = Two.Utils.getRatio;

  // Returns true if the given rect intersects the viewport
  // FIXME: Hardcoded width/height
  var intersectsViewport = function (rect) {
    if ((rect.left > 768) || ((rect.left + rect.width) < 0)) {
        return false;
    }
    if ((rect.top > (1024)) || ((rect.top + rect.height) < 0)) {
        return false;
    }
    return true;
  };

  // Returns true if this is a non-transforming matrix
  var isDefaultMatrix = function (m) {
    return (m[0] == 1 && m[3] == 0 && m[1] == 0 && m[4] == 1 && m[2] == 0 && m[5] == 0);
  };

  var canvas = {

    group: {

      renderChild: function(child) {
        canvas[child._renderer.type].render.call(child, this);
      },

      render: function(ctx) {
        var can, oldCtx, creatingCache, i, child, rect, defaultMatrix, matrix, parent, opacity;

        // TODO: Add a check here to only invoke _update if need be.
        this._update();

        matrix = this._matrix.elements;
        parent = this.parent;

        // Shortcut for hidden objects.
        // Doesn't reset the flags, so changes are stored and
        // applied once the object is visible again
        if (this._opacity === 0 && !this._flagOpacity) {
          return this;
        }

        // Invalidate cache on scale changes or when children have been modified or addded.
        // TODO: The children flag is not yet set automatically.
        if (this.cachedBitmap && (this._flagChildren || this._flagScale || this._flagAdditions)) {
            this.cachedBitmap = null;
            this._flagChildren = false;
        }

        // Create an offscreen canvas on which to render this group
        if (this.cacheEnabled && !this.cachedBitmap) {
          // Pixel ratio (Retina devices)
          var ratio = Two.Instances[0].renderer.ratio;
          var isOne = ratio === 1;

          // Set flag
          creatingCache = true;
          oldCtx = ctx;
          can = document.createElement('canvas');

          this.cachedRect = rect = this.getBoundingClientRect(true);
          this.cachedBitmap = can;

          if (this.cacheViewport) {
            rect.left = Math.max(0, rect.left);
            rect.top = Math.max(0, rect.top);

            this.cachedRect = rect = {
              left: rect.left ,
              top: rect.top,
              height: 1024 - rect.top,
              width: 768 - rect.left
            };
          }

          can.width = Math.max(1, Math.ceil(rect.width)) * ratio;
          can.height = Math.max(1, Math.ceil(rect.height)) * ratio;

          ctx = can.getContext('2d');

          if (!isOne) {
            ctx.scale(ratio, ratio);
          }

          ctx.translate(-rect.left, -rect.top);

        } else if (this.cacheEnabled && this.cachedBitmap) {
          return canvas.group.renderCached.call(this, ctx);
        }

        // Render out the group elements on the current context
        defaultMatrix = isDefaultMatrix(matrix);

        if (creatingCache) {
          opacity = 1;
        } else {
          opacity = this._opacity * (parent && parent._renderer ? parent._renderer.opacity : 1);
        }

        this._renderer.opacity = opacity;

        if (!defaultMatrix && !creatingCache) {
          ctx.save();
          ctx.transform(matrix[0], matrix[3], matrix[1], matrix[4], matrix[2], matrix[5]);
        }

        for (i = 0; i < this.children.length; i++) {
          child = this.children[i];
          canvas[child._renderer.type].render.call(child, ctx);
        }

        if (!defaultMatrix && !creatingCache) {
          ctx.restore();
        }

        if (creatingCache) {
          return canvas.group.renderCached.call(this, oldCtx);
        } else {
          return this.flagReset();
        }

      },

      renderCached: function (ctx) {
        var ratio = Two.Instances[0].renderer.ratio;
        var isOne = ratio === 1;
        var matrix = this._matrix.elements;
        var parent = this.parent;

        var r = {
          left: this.cachedRect.left + matrix[2],
          top:  this.cachedRect.top + matrix[5],
          width: this.cachedRect.width,
          height: this.cachedRect.height
        };

        if (!intersectsViewport(r)) {
          return;
        }


        ctx.globalAlpha = this._opacity * (parent && parent._renderer ? parent._renderer.opacity : 1);


        ctx.drawImage(this.cachedBitmap, 0, 0, r.width * ratio, r.height * ratio, r.left, r.top, r.width, r.height);



        return this.flagReset();
      }

    },

    polygon: {

      render: function(ctx) {

        var matrix, stroke, linewidth, fill, opacity, visible, cap, join, miter,
            closed, commands, length, last, next, prev, a, c, d, ux, uy, vx, vy,
            ar, bl, br, cl, x, y, creatingCache = false, oldCtx, can, b, defaultMatrix;

        // TODO: Add a check here to only invoke _update if need be.
        this._update();


        // Invalidate cache
        // if (this.cachedBitmap && this._flagVertices) {
        //   this.cachedBitmap = null;
        // }


        // if (this.cacheEnabled && !this.cachedBitmap) {
        //   // Set flag
        //   creatingCache = true;
        //
        //   oldCtx = ctx;
        //
        //   can = document.createElement('canvas');
        //   ctx = can.getContext('2d');
        //
        // } else if (this.cacheEnabled && this.cachedBitmap) {
        //   return canvas.polygon.renderCached.call(this, ctx);
        // }

        opacity = this._opacity * this.parent._renderer.opacity;
        visible = this._visible;

        if (!visible || !opacity) {
          return this;
        }

        matrix = this._matrix.elements;
        stroke = this._stroke;
        linewidth = this._linewidth;
        fill = this._fill;
        cap = this._cap;
        join = this._join;
        miter = this._miter;
        closed = this._closed;
        commands = this._vertices; // Commands
        length = commands.length;
        last = length - 1;
        defaultMatrix = isDefaultMatrix(matrix);


        // Transform
        if (!defaultMatrix && !creatingCache) {
          ctx.save();
          ctx.transform(matrix[0], matrix[3], matrix[1], matrix[4], matrix[2], matrix[5]);
        }


        // Styles
        if (fill) {
          ctx.fillStyle = fill;
        }
        if (stroke) {
          ctx.strokeStyle = stroke;
        }
        if (linewidth) {
          ctx.lineWidth = linewidth;
        }
        if (miter) {
          ctx.miterLimit = miter;
        }
        if (join) {
          ctx.lineJoin = join;
        }
        if (cap) {
          ctx.lineCap = cap;
        }
        if (_.isNumber(opacity) && !creatingCache) {
          ctx.globalAlpha = opacity;
        }

        ctx.beginPath();
        commands.forEach(function(b, i) {

          x = toFixed(b.x);
          y = toFixed(b.y);

          switch (b._command) {

            case Two.Commands.close:
              ctx.closePath();
              break;

            case Two.Commands.curve:

              prev = closed ? mod(i - 1, length) : Math.max(i - 1, 0);
              next = closed ? mod(i + 1, length) : Math.min(i + 1, last);

              a = commands[prev];
              c = commands[next];
              ar = (a.controls && a.controls.right) || a;
              bl = (b.controls && b.controls.left) || b;

              if (a._relative) {
                vx = (ar.x + toFixed(a.x));
                vy = (ar.y + toFixed(a.y));
              } else {
                vx = toFixed(ar.x);
                vy = toFixed(ar.y);
              }

              if (b._relative) {
                ux = (bl.x + toFixed(b.x));
                uy = (bl.y + toFixed(b.y));
              } else {
                ux = toFixed(bl.x);
                uy = toFixed(bl.y);
              }

              ctx.bezierCurveTo(vx, vy, ux, uy, x, y);

              if (i >= last && closed) {

                c = d;

                br = (b.controls && b.controls.right) || b;
                cl = (c.controls && c.controls.left) || c;

                if (b._relative) {
                  vx = (br.x + toFixed(b.x));
                  vy = (br.y + toFixed(b.y));
                } else {
                  vx = toFixed(br.x);
                  vy = toFixed(br.y);
                }

                if (c._relative) {
                  ux = (cl.x + toFixed(c.x));
                  uy = (cl.y + toFixed(c.y));
                } else {
                  ux = toFixed(cl.x);
                  uy = toFixed(cl.y);
                }

                x = toFixed(c.x);
                y = toFixed(c.y);

                ctx.bezierCurveTo(vx, vy, ux, uy, x, y);

              }

              break;

            case Two.Commands.line:
              ctx.lineTo(x, y);
              break;

            case Two.Commands.move:
              d = b;
              ctx.moveTo(x, y);
              break;

          }

        });

        // Loose ends

        if (closed) {
          ctx.closePath();
        }

        if (fill != 'transparent') ctx.fill();
        if (stroke != 'transparent') ctx.stroke();

        if (!defaultMatrix) {
          ctx.restore();
        }

        if (creatingCache) {
          this.cachedBitmap = can;
          return canvas.polygon.renderCached.call(this, oldCtx);
        }

        return this.flagReset();

      },

      renderCached: function (ctx) {
        var matrix = this._matrix.elements;
        var opacity = this._opacity * this.parent._renderer.opacity;



        if (matrix) {
          ctx.save();
          ctx.transform(
            matrix[0], matrix[3], matrix[1], matrix[4], matrix[2], matrix[5]);
        }
        if (_.isNumber(opacity)) {
          ctx.globalAlpha = opacity;
        }

        ctx.drawImage(this.cachedBitmap, 0, 0);

        if (matrix) {
          ctx.restore();
        }

        return this.flagReset();
      }

    }

  };

  var Renderer = Two[Two.Types.canvas] = function(params) {

    this.domElement = params.domElement || document.createElement('canvas');
    this.ctx = this.domElement.getContext('2d');
    this.overdraw = params.overdraw || false;

    // Everything drawn on the canvas needs to be added to the scene.
    this.scene = new Two.Group();
    this.scene.parent = this;

  };

  _.extend(Renderer, {

    Utils: canvas

  });

  _.extend(Renderer.prototype, Backbone.Events, {

    setSize: function(width, height, ratio) {

      this.width = width;
      this.height = height;

      this.ratio = _.isUndefined(ratio) ? getRatio(this.ctx) : ratio;

      this.domElement.width = width * this.ratio;
      this.domElement.height = height * this.ratio;

      _.extend(this.domElement.style, {
        width: width + 'px',
        height: height + 'px'
      });

      return this;

    },

    render: function() {

      var isOne = this.ratio === 1;

      if (!isOne) {
        this.ctx.save();
        this.ctx.scale(this.ratio, this.ratio);
      }

      if (!this.overdraw) {
        this.ctx.clearRect(0, 0, this.width, this.height);
      }

      canvas.group.render.call(this.scene, this.ctx);

      if (!isOne) {
        this.ctx.restore();
      }

      return this;

    }

  });

  function resetTransform(ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

})(Two);
