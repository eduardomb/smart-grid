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
*   - sizes: [[1, 1]]    List of possible sizes [width, height] for elements.
*   - startsWith: []     Set specific sizes for first elements.
*   - classSizes: {}     Override sizes and startsWith parameters above and set
*                          new sizes list for specific classes.
*                          Ex: {class1: [[1, 1]], class2: [[3,1],[3,2]]}
*   - aspectRatio        Number of times box height should be bigger than
*                        width.
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

    function shuffle(array) {
      var currentIndex = array.length,
          temporaryValue,
          randomIndex;

      // While there remain elements to shuffle...
      while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
      }

      return array;
    }

    /**
     * Check if an element is allocable in a given position.
     */
    function isAllocable(size, pos) {
      if (pos[Y] + size[Y] - 1 >= s.cols) {
        return false;  // Element is too wide.
      }

      for (var i = pos[X]; i < pos[X] + size[X]; i++) {
        for (var j = pos[Y]; j < pos[Y] + size[Y]; j++) {
          if (grid[i] !== undefined && grid[i][j] >= 0) {
            return false;  // Space is already taken.
          }
        }
      }

      return true;
    }

    /**
     * Get position of first empty space on grid.
     */
    function firstEmptySpace() {
      for (var i = 0; i < grid.length; i++) {
        for (var j = 0; j < s.cols; j++) {
          if (grid[i][j] === undefined) {
            return [i, j];
          }
        }
      }

      return [grid.length, 0];
    }

    /**
     * Get a rndom size for the element.
     */
    function getRandomSize(pos, elementsRemaining, sizes) {
      sizes = shuffle(sizes);

      /* Force last element to have size [1, 1]. It will be streched latter to
       * make a perfect grid. */
      if(elementsRemaining == 1) {
        return [1, 1];
      }

      for (var i = 0; i < sizes.length; i++) {
        if (isAllocable(sizes[i], pos)) {
          return sizes[i];
        }
      }

      return [1, 1];
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
        'width': px((end - start) * (boxWidth + vs) + boxWidth),
        'left': px(start * (boxWidth + vs)),
        'top': px(x * (boxHeight + vs) + boxHeight + s.hSpacing)
      });

      element.append(line);
    }

    function drawElement($element, config) {
      // Set element position and dimensions on screen.
      $element.css({
        'position': 'absolute',
        'display': 'inline-block',
        'width': px(config.cols * (boxWidth + vs) - vs),
        'height': px(config.rows * (boxHeight + hs) - hs),
        'left': px(config.pos[Y] * (boxWidth + vs)),
        'top': px(config.pos[X] * (boxHeight + hs))
      });
    }

    function isRightFrontier(x, y) {
      return grid[x] !== undefined && grid[x][y] != grid[x][y + 1];
    }

    function isTopFrontier(x, y) {
      return grid[x][y] != grid[x + 1][y];
    }

    function shrinkRows($element, shrinkTo) {
      var currentRows = $element.data('rows'),
          cols = $element.data('cols'),
          pos = $element.data('pos');

      for (var i = shrinkTo + 1; i < pos[X] + currentRows; i++) {
        for (var j = pos[Y]; j < pos[Y] + cols; j++) {
          grid[i][j] = undefined;
        }
      }

      $element.data('rows', shrinkTo - pos[X] + 1);
      drawElement($element, $element.data());
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
      'selector': 'div',
      'sizes': [[1, 1]],
      'startsWith': [],
      'aspectRatio': 1
    }, options);

    // Aux vars.
    var id = 0,
        grid = [],
        vs = s.vSpacing * 2 + s.vLineThickness,
        hs = s.hSpacing * 2 + s.hLineThickness,
        boxWidth = (this.width() - (s.cols - 1) * vs) / s.cols,
        boxHeight = boxWidth * s.aspectRatio,
        $elements = $(s.selector, this),
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

    if (!$elements.length) {
      return this;
    }

    // 1. Insert each element in grid using First Fit.
    $elements.each(function(i) {
      var pos = firstEmptySpace(),
          size = getRandomSize(pos, $elements.length - i, s.sizes),
          stringify = function(i) { return i.join(); },
          config;

      // Overide first elements sizes with startsWith.
      size = s.startsWith[i] || size;

      // Override size if element has any of the classes defined on classSizes.
      for (var key in s.classSizes) {
        var stringifiedList = s.classSizes[key].map(stringify),
            sizeInClassSizes = stringifiedList.indexOf(stringify(size)) != -1;

        if ($(this).hasClass(key) && !sizeInClassSizes) {
          size = getRandomSize(pos, $elements.length - i, s.classSizes[key]);
        }
      }


      config = {
        'id': id++,
        'pos': pos,
        'rows': size[0],
        'cols': size[1]
      };

      // Find the first fiting position.
      //while (!isAllocable(config, pos)) {
      //  if (pos[Y] < s.cols) {
      //    pos[Y] += 1;  // Jump a column.
      //  } else {
      //    pos[X] += 1;  // Jump a line.
      //    pos[Y] = 0;  // Reset column to left.
      //  }
      //}

      // Mark the element position in the virtual grid.
      for (i = pos[X]; i < pos[X] + config.rows; i++) {
        if (grid[i] === undefined) {
          grid[i] = [];
        }

        for (j = pos[Y]; j < pos[Y] + config.cols; j++) {
          grid[i][j] = config.id;
        }
      }

      drawElement($(this), config);

      // Store element info.
      $(this).data(config);
    });

    // If any element positioned on the left of the last element ends at a
    // higher row than the last element it's necessary to shrink its rows
    // until it ends at the same row of the last element.
    var $last = $($elements[$elements.length - 1]),
        posLast = $last.data('pos'),
        rowsLast = $last.data('rows'),
        colsLast = $last.data('cols'),
        $element,
        allFilled;

    if (grid[posLast[X] + rowsLast] !== undefined) {
      for (i = 0; i < posLast[Y]; i++) {
        if (grid[posLast[X] + rowsLast][i] >= 0) {
          $element = $($elements[grid[posLast[X] + rowsLast][i]]);

          shrinkRows($element, posLast[X] + rowsLast - 1);
        }
      }
    }

    // If any element positioned on the right of the last element ends at a
    // the same row as the the last element it's necessary to shrink its rows
    // until it ends at the row above of the last element.
    allFilled = true;

    for (i = posLast[Y] + colsLast; i < s.cols; i++) {
      allFilled &= grid[posLast[X]][i] >= 0;
    }

    if(!allFilled) {
      for (i = posLast[Y] + colsLast; i < s.cols; i++) {
        if (grid[posLast[X]][i] >= 0) {
          $element = $($elements[grid[posLast[X]][i]]);

          shrinkRows($element, posLast[X] - 1);
        }
      }
    }

    // Expand the last element to the end of grid.
    allFilled = true;

    for (i = posLast[Y] + colsLast; i < s.cols; i++) {
      allFilled &= grid[posLast[X]][i] >= 0;
    }

    if (!allFilled) {
      for (i = posLast[X]; i < posLast[X] + rowsLast; i++) {
        for (j = posLast[Y] + colsLast; j < s.cols; j++) {
          grid[i][j] = $last.data('id');
        }
      }
      $last.data('cols', s.cols - posLast[Y]);
      drawElement($last, $last.data());
    }

    // Remove extra grid lines.
    grid.splice(posLast[X] + rowsLast, grid.length - posLast[X] - rowsLast);



    // 2. Group consecutive vertical sep lines and draw them.
    for (y = 0; y < s.cols - 1; y++) {
      start = null;
      end = null;
      x = 0;

      while (x < grid.length) {
        // While exists consecutive sep lines.
        while (isRightFrontier(x++, y)) {
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
            'height': px((end - start) * (boxHeight + hs) + boxHeight),
            'left': px(y * (boxWidth + vs) + boxWidth + s.vSpacing),
            'top': px(start * (boxHeight + hs))
          });

          this.append(line);

          start = null;
          end = null;
        }
      }
    }

    // 3. Group consecutive horizontal sep lines that doesn't cross separation
    // vertical lines and draw them.
    for (x = 0; x < grid.length - 1; x++) {
      start = null;
      end = null;
      y = 0;

      while (grid[x] !== undefined && y < s.cols) {
        // While exists consecutive separation lines.
        while (isTopFrontier(x, y++)) {
          if (start === null) {
            start = y - 1;
          }

          else if(isRightFrontier(x, y - 2) && isRightFrontier(x + 1, y - 2)) {
            // Although the line is consecutive, it wont be grouped because
            // in this case it would colide with a vertical line. Thus, the
            // line must end before it colides and a new one is started.
            drawHorizontalLine(this, start, end);
            start = y - 1;
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
    this.height(grid.length * (boxHeight + hs));

    return this;
  };
})(jQuery);
