/**
* Grid First-Fit plugin.
*
* Arrange a set of elements in a grid using the first-fit algorithm. The grid
* has a pre-determined number of columns and each element in the set has it's
* number of rows and columns. For each element, the algorithm looks for a fit
* in grid from left to right starting from the top.
*
* Optionally draw non-crossing lines separators between elements.
*
* Usage Example:
*   <div id="#my-grid">
*     <div data-rows="1" data-cols="1" >#1</div>
*     <div data-rows="1" data-cols="2" >#2</div>
*     <div data-rows="1" data-cols="3" >#3</div>
*     <div data-rows="2" data-cols="1" >#4</div>
*   </div>
*
*   <script type="text/javascript">
*     $('#mygrid').grid({'cols': 4})
*   </script>
*
* The above example will generate a 4-column grid with the following format:
*   ┌──────────────────┐
*   | #1 |   #2   |    |
*   |─────────────| #4 |
*   |      #3     |    |
*   └──────────────────┘
*
* The default options are:
*   - cols: 3            Number of columns
*   - hSpacing: 10       Horizontal spacing from border to sep line
*   - vSpacing: 10       Vertical spacing from element border to sep line
*   - hLineThickness: 1  Horizontal sep line thickness
*   - vLineThickness: 1  Vertical sep line thickness
*   - hLineColor: #ccc   Horiontal sep line color
*   - vLineColor: #ccc   Vertical sep line color
*   - selector: div      Selector for elements in grid
*/
(function($){
  'use strict';

  $.fn.grid = function(options) {
    /**
     * Convert an integer into a string and append 'px' to it.
     */
    function px(num) {
      return num + 'px';
    }

    /**
     * Check if an element is allocable in a given position.
     */
    function isAllocable(element, pos) {
      if (pos[Y] + element.cols - 1 >= s.cols) {
        return false;  // Element is too wide.
      }

      for (var i = pos[X]; i < pos[X] + element.rows; i++) {
        for (var j = pos[Y]; j < pos[Y] + element.cols; j++) {
          if (grid[i] !== undefined && grid[i][j]) {
            return false;  // Space is already taken.
          }
        }
      }

      return true;
    }

    /**
    * Draw a horizontal line after element based on variables 'start' and 'end'
    */
    function drawHorizontalLine(element, start, end) {
      var line = $('<div></div>');

      line.css({
        'height': '0',
        'border-bottom-color': s.hLineColor,
        'border-bottom-width': px(s.hLineThickness),
        'border-bottom-style': 'dotted',
        'position': 'absolute',
        'width': px((end - start) * (boxSide + vs) + boxSide),
        'left': px(start * (boxSide + vs)),
        'top': px(x * (boxSide + vs) + boxSide + s.hSpacing)
      });

      element.append(line);
    }

    // Constants.
    var X = 0,
        Y = 1;

    // Default params.
    var s = $.extend({
      'cols': 3,
      'hSpacing': 10,
      'vSpacing': 10,
      'hLineThickness': 1,
      'vLineThickness': 1,
      'hLineColor': '#ccc',
      'vLineColor': '#ccc',
      'selector': 'div'
    }, options);

    // Aux vars.
    var id = 0,
        grid = [],
        vLines = [],
        hLines = [],
        vs = s.vSpacing * 2 + s.vLineThickness,
        hs = s.hSpacing * 2 + s.hLineThickness,
        boxSide = (this.width() - (s.cols - 1) * vs) / s.cols,
        start,
        end;

    // Iterators.
    var i, j, x, y;

    // Grid position must be relative or absolute in order to position posts
    // with position absolute in relation to grid. If the grid element position
    // is static (default css position) it will be set to relative. If the
    // element position is fixed we raise an error and return because changing
    // its position is a potencial harm to the layout.
    if (this.css('position') == 'fixed') {
      $.error('Grid objects can\'t have position: fixed on CSS.');
      return this;
    } else if (this.css('position') == 'static') {
      this.css('position', 'relative');
    }

    // 1. Insert each element in grid using First Fit.
    $(s.selector, this).each(function() {
      var pos = [0, 0];
      var element = {
        'id': ++id,
        'cols': $(this).data('cols'),
        'rows': $(this).data('rows')
      };

      // Find the first fiting position.
      while (!isAllocable(element, pos)) {
        if (pos[Y] < s.cols) {
          pos[Y] += 1;  // Jump a column.
        } else {
          pos[X] += 1;  // Jump a line.
          pos[Y] = 0;  // Reset column to left.
        }
      }

      // Mark the element position in a virtual auxiliar grid.
      for (i = pos[X]; i < pos[X] + element.rows; i++) {
        if (grid[i] === undefined) {
          grid[i] = [];
        }

        for (j = pos[Y]; j < pos[Y] + element.cols; j++) {
          grid[i][j] = id;
        }
      }

      // Mark the horizontal sep lines position in a virtual auxiliar grid.
      if (pos[X] > 0) {
        if (hLines[pos[X] - 1] === undefined) {
          hLines[pos[X] - 1] = [];
        }

        for (i = pos[Y]; i < pos[Y] + element.cols; i++) {
          hLines[pos[X] - 1][i] = true;
        }
      }

      // Mark the vertical sep lines position in a virtual auxiliar grid.
      if (pos[Y] > 0) {
        for (i = pos[X]; i < pos[X] + element.rows; i++) {
          if (vLines[i] === undefined) {
            vLines[i] = [];
          }

          vLines[i][pos[Y] - 1] = true;
        }
      }

      // Set element position and dimensions on screen.
      $(this).css({
        'position': 'absolute',
        'display': 'inline-block',
        'width': px(element.cols * (boxSide + vs) - vs),
        'height': px(element.rows * (boxSide + hs) - hs),
        'left': px(pos[Y] * (boxSide + vs)),
        'top': px(pos[X] * (boxSide + hs))
      });
    });

    // 2. Group consecutive vertical sep lines and draw them.
    for (y = 0; y < s.cols - 1; y++) {
      start = null;
      end = null;
      x = 0;

      while (x < vLines.length) {
        // While exists consecutive sep lines.
        while (vLines[x++] !== undefined && vLines[x - 1][y]) {
          if (start === null) {
            start = x - 1;
            end = x - 1;
          } else {
            end = x - 1;
          }
        }

        if (start !== null && end !== null) {
          var line = $('<div></div>');

          line.css({
            'width': '0',
            'border-left-width': px(s.vLineThickness),
            'border-left-style': 'dotted',
            'border-left-color': s.vLineColor,
            'position': 'absolute',
            'height': px((end - start) * (boxSide + hs) + boxSide),
            'left': px(y * (boxSide + vs) + boxSide + s.vSpacing),
            'top': px(start * (boxSide + hs))
          });

          this.append(line);

          start = null;
          end = null;
        }
      }
    }

    // 3. Group consecutive horizontal sep lines that doesn't cross separation
    // vertical lines and draw them.
    for (x = 0; x < hLines.length; x++) {
      start = null;
      end = null;
      y = 0;

      while (hLines[x] !== undefined && y < s.cols) {
        // While exists consecutive separation lines.
        while (hLines[x][y++]) {
          if (start === null) {
            start = y - 1;
          }

          else if (vLines[x] !== undefined  && vLines[x + 1] !== undefined) {
            if(vLines[x][y - 2] && vLines[x + 1][y -2]) {
              // Although the line is consecutive, it wont be grouped because
              // in this case it would colide with a vertical line. Thus, the
              // line must end before it colides and a new one is started.
              drawHorizontalLine(this, start, end);
              start = y - 1;
            }
          }

          end = y - 1;
        }

        if (start !== null && end !== null) {
          drawHorizontalLine(this, start, end);
          start = null;
          end = null;
        }
      }
    }

    // 4. Set the grid total height.
    this.height(grid.length * (boxSide + hs));

    return this;
  };
})(jQuery);
