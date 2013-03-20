Smart Grid
==========
Smart Grid is a jQuery plugin that generates a smart grid for your HTML. All
you need to do is choose the number of columns for the grid and define the
dimensions for each element. The plugin will arrange the elements using the
first fit algorithm and draw smart non-crossing separation lines for each of
them.  Check out the HTML examples.

Usage Example
-------------
    <div id="#my-grid">
      <div data-rows="1" data-cols="1" >#1</div>
      <div data-rows="1" data-cols="2" >#2</div>
      <div data-rows="1" data-cols="3" >#3</div>
      <div data-rows="2" data-cols="1" >#4</div>
    </div>

    <script type="text/javascript">
      $('#my-grid').grid({'cols': 4})
    </script>

The above example will generate a 4-column grid with the following format:
<pre>
┌──────────────────┐
| #1 |   #2   |    |
|─────────────| #4 |
|      #3     |    |
└──────────────────┘
</pre>

Check out more examples on *examples* folder.

Default options
---------------
    cols: 3            Number of columns
    hSpacing: 10       Horizontal spacing from border to sep line
    vSpacing: 10       Vertical spacing from element border to sep line
    hLineThickness: 1  Horizontal sep line thickness
    vLineThickness: 1  Vertical sep line thickness
    hLineColor: #ccc   Horiontal sep line color
    vLineColor: #ccc   Vertical sep line color
    selector: div      Selector for elements in grid
