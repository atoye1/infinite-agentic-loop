# Bar Chart Race, Explained

## Disclaimer
This is a pedagogical implementation of an animated bar chart race from d3.js author.
This example is running on observables notebook, but will working in any react component also
So you need to parse this code and apply it to your remotion project 


## Code
```javascript
function _1(md){return(
md`<div style="color: grey; font: 13px/25.5px var(--sans-serif); text-transform: uppercase;"><h1 style="display: none;">Bar Chart Race</h1><a href="https://d3js.org/">D3</a> › <a href="/@d3/gallery">Gallery</a></div>

# Bar Chart Race

This chart animates the value (in $M) of the top global brands from 2000 to 2019. Color indicates sector. See [the explainer](/d/e9e3929cf7c50b45) for more. Data: [Interbrand](https://www.interbrand.com/best-brands/)`
)}

function _data(FileAttachment){return(
FileAttachment("category-brands.csv").csv({typed: true})
)}

function _replay(html){return(
html`<button>Replay`
)}

async function* _chart(replay,d3,width,height,bars,axis,labels,ticker,keyframes,duration,x,invalidation)
{
  replay;

  const svg = d3.create("svg")
      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("height", height)
      .attr("style", "max-width: 100%; height: auto;");

  const updateBars = bars(svg);
  const updateAxis = axis(svg);
  const updateLabels = labels(svg);
  const updateTicker = ticker(svg);

  yield svg.node();

  for (const keyframe of keyframes) {
    const transition = svg.transition()
        .duration(duration)
        .ease(d3.easeLinear);

    // Extract the top bar’s value.
    x.domain([0, keyframe[1][0].value]);

    updateAxis(keyframe, transition);
    updateBars(keyframe, transition);
    updateLabels(keyframe, transition);
    updateTicker(keyframe, transition);

    invalidation.then(() => svg.interrupt());
    await transition.end();
  }
}


function _duration(){return(
250
)}

function _n(){return(
12
)}

function _names(data){return(
new Set(data.map(d => d.name))
)}

function _datevalues(d3,data){return(
Array.from(d3.rollup(data, ([d]) => d.value, d => +d.date, d => d.name))
  .map(([date, data]) => [new Date(date), data])
  .sort(([a], [b]) => d3.ascending(a, b))
)}

function _rank(names,d3,n){return(
function rank(value) {
  const data = Array.from(names, name => ({name, value: value(name)}));
  data.sort((a, b) => d3.descending(a.value, b.value));
  for (let i = 0; i < data.length; ++i) data[i].rank = Math.min(n, i);
  return data;
}
)}

function _k(){return(
10
)}

function _keyframes(d3,datevalues,k,rank)
{
  const keyframes = [];
  let ka, a, kb, b;
  for ([[ka, a], [kb, b]] of d3.pairs(datevalues)) {
    for (let i = 0; i < k; ++i) {
      const t = i / k;
      keyframes.push([
        new Date(ka * (1 - t) + kb * t),
        rank(name => (a.get(name) || 0) * (1 - t) + (b.get(name) || 0) * t)
      ]);
    }
  }
  keyframes.push([new Date(kb), rank(name => b.get(name) || 0)]);
  return keyframes;
}


function _nameframes(d3,keyframes){return(
d3.groups(keyframes.flatMap(([, data]) => data), d => d.name)
)}

function _prev(nameframes,d3){return(
new Map(nameframes.flatMap(([, data]) => d3.pairs(data, (a, b) => [b, a])))
)}

function _next(nameframes,d3){return(
new Map(nameframes.flatMap(([, data]) => d3.pairs(data)))
)}

function _bars(n,color,y,x,prev,next){return(
function bars(svg) {
  let bar = svg.append("g")
      .attr("fill-opacity", 0.6)
    .selectAll("rect");

  return ([date, data], transition) => bar = bar
    .data(data.slice(0, n), d => d.name)
    .join(
      enter => enter.append("rect")
        .attr("fill", color)
        .attr("height", y.bandwidth())
        .attr("x", x(0))
        .attr("y", d => y((prev.get(d) || d).rank))
        .attr("width", d => x((prev.get(d) || d).value) - x(0)),
      update => update,
      exit => exit.transition(transition).remove()
        .attr("y", d => y((next.get(d) || d).rank))
        .attr("width", d => x((next.get(d) || d).value) - x(0))
    )
    .call(bar => bar.transition(transition)
      .attr("y", d => y(d.rank))
      .attr("width", d => x(d.value) - x(0)));
}
)}

function _labels(n,x,prev,y,next,textTween){return(
function labels(svg) {
  let label = svg.append("g")
      .style("font", "bold 12px var(--sans-serif)")
      .style("font-variant-numeric", "tabular-nums")
      .attr("text-anchor", "end")
    .selectAll("text");

  return ([date, data], transition) => label = label
    .data(data.slice(0, n), d => d.name)
    .join(
      enter => enter.append("text")
        .attr("transform", d => `translate(${x((prev.get(d) || d).value)},${y((prev.get(d) || d).rank)})`)
        .attr("y", y.bandwidth() / 2)
        .attr("x", -6)
        .attr("dy", "-0.25em")
        .text(d => d.name)
        .call(text => text.append("tspan")
          .attr("fill-opacity", 0.7)
          .attr("font-weight", "normal")
          .attr("x", -6)
          .attr("dy", "1.15em")),
      update => update,
      exit => exit.transition(transition).remove()
        .attr("transform", d => `translate(${x((next.get(d) || d).value)},${y((next.get(d) || d).rank)})`)
        .call(g => g.select("tspan").tween("text", d => textTween(d.value, (next.get(d) || d).value)))
    )
    .call(bar => bar.transition(transition)
      .attr("transform", d => `translate(${x(d.value)},${y(d.rank)})`)
      .call(g => g.select("tspan").tween("text", d => textTween((prev.get(d) || d).value, d.value))));
}
)}

function _textTween(d3,formatNumber){return(
function textTween(a, b) {
  const i = d3.interpolateNumber(a, b);
  return function(t) {
    this.textContent = formatNumber(i(t));
  };
}
)}

function _formatNumber(d3){return(
d3.format(",d")
)}

function _tickFormat(){return(
undefined
)}

function _axis(marginTop,d3,x,width,tickFormat,barSize,n,y){return(
function axis(svg) {
  const g = svg.append("g")
      .attr("transform", `translate(0,${marginTop})`);

  const axis = d3.axisTop(x)
      .ticks(width / 160, tickFormat)
      .tickSizeOuter(0)
      .tickSizeInner(-barSize * (n + y.padding()));

  return (_, transition) => {
    g.transition(transition).call(axis);
    g.select(".tick:first-of-type text").remove();
    g.selectAll(".tick:not(:first-of-type) line").attr("stroke", "white");
    g.select(".domain").remove();
  };
}
)}

function _ticker(barSize,width,marginTop,n,formatDate,keyframes){return(
function ticker(svg) {
  const now = svg.append("text")
      .style("font", `bold ${barSize}px var(--sans-serif)`)
      .style("font-variant-numeric", "tabular-nums")
      .attr("text-anchor", "end")
      .attr("x", width - 6)
      .attr("y", marginTop + barSize * (n - 0.45))
      .attr("dy", "0.32em")
      .text(formatDate(keyframes[0][0]));

  return ([date], transition) => {
    transition.end().then(() => now.text(formatDate(date)));
  };
}
)}

function _formatDate(d3){return(
d3.utcFormat("%Y")
)}

function _color(d3,data)
{
  const scale = d3.scaleOrdinal(d3.schemeTableau10);
  if (data.some(d => d.category !== undefined)) {
    const categoryByName = new Map(data.map(d => [d.name, d.category]))
    scale.domain(categoryByName.values());
    return d => scale(categoryByName.get(d.name));
  }
  return d => scale(d.name);
}


function _x(d3,marginLeft,width,marginRight){return(
d3.scaleLinear([0, 1], [marginLeft, width - marginRight])
)}

function _y(d3,n,marginTop,barSize){return(
d3.scaleBand()
    .domain(d3.range(n + 1))
    .rangeRound([marginTop, marginTop + barSize * (n + 1 + 0.1)])
    .padding(0.1)
)}

function _height(marginTop,barSize,n,marginBottom){return(
marginTop + barSize * n + marginBottom
)}

function _barSize(){return(
48
)}

function _marginTop(){return(
16
)}

function _marginRight(){return(
6
)}

function _marginBottom(){return(
6
)}

function _marginLeft(){return(
0
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["category-brands.csv", {url: new URL("./files/aec3792837253d4c6168f9bbecdf495140a5f9bb1cdb12c7c8113cec26332634a71ad29b446a1e8236e0a45732ea5d0b4e86d9d1568ff5791412f093ec06f4f1.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("data")).define("data", ["FileAttachment"], _data);
  main.variable(observer("viewof replay")).define("viewof replay", ["html"], _replay);
  main.variable(observer("replay")).define("replay", ["Generators", "viewof replay"], (G, _) => G.input(_));
  main.variable(observer("chart")).define("chart", ["replay","d3","width","height","bars","axis","labels","ticker","keyframes","duration","x","invalidation"], _chart);
  main.variable(observer("duration")).define("duration", _duration);
  main.variable(observer("n")).define("n", _n);
  main.variable(observer("names")).define("names", ["data"], _names);
  main.variable(observer("datevalues")).define("datevalues", ["d3","data"], _datevalues);
  main.variable(observer("rank")).define("rank", ["names","d3","n"], _rank);
  main.variable(observer("k")).define("k", _k);
  main.variable(observer("keyframes")).define("keyframes", ["d3","datevalues","k","rank"], _keyframes);
  main.variable(observer("nameframes")).define("nameframes", ["d3","keyframes"], _nameframes);
  main.variable(observer("prev")).define("prev", ["nameframes","d3"], _prev);
  main.variable(observer("next")).define("next", ["nameframes","d3"], _next);
  main.variable(observer("bars")).define("bars", ["n","color","y","x","prev","next"], _bars);
  main.variable(observer("labels")).define("labels", ["n","x","prev","y","next","textTween"], _labels);
  main.variable(observer("textTween")).define("textTween", ["d3","formatNumber"], _textTween);
  main.variable(observer("formatNumber")).define("formatNumber", ["d3"], _formatNumber);
  main.variable(observer("tickFormat")).define("tickFormat", _tickFormat);
  main.variable(observer("axis")).define("axis", ["marginTop","d3","x","width","tickFormat","barSize","n","y"], _axis);
  main.variable(observer("ticker")).define("ticker", ["barSize","width","marginTop","n","formatDate","keyframes"], _ticker);
  main.variable(observer("formatDate")).define("formatDate", ["d3"], _formatDate);
  main.variable(observer("color")).define("color", ["d3","data"], _color);
  main.variable(observer("x")).define("x", ["d3","marginLeft","width","marginRight"], _x);
  main.variable(observer("y")).define("y", ["d3","n","marginTop","barSize"], _y);
  main.variable(observer("height")).define("height", ["marginTop","barSize","n","marginBottom"], _height);
  main.variable(observer("barSize")).define("barSize", _barSize);
  main.variable(observer("marginTop")).define("marginTop", _marginTop);
  main.variable(observer("marginRight")).define("marginRight", _marginRight);
  main.variable(observer("marginBottom")).define("marginBottom", _marginBottom);
  main.variable(observer("marginLeft")).define("marginLeft", _marginLeft);
  return main;
}

```
## Explanation
This is a pedagogical implementation of an animated bar chart race. Read on to learn how it works, or fork this notebook and drop in your data!

data = Array(1975) [Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, …]
The data for the race is a CSV with columns date (in YYYY-MM-DD format), name, value and optionally category (which if present determines color). To replace the data, click the file icon  in the cell above.

Replay
replay = ""
Best Global Brands
Value in $M; color indicates sector. Data: Interbrand

20,000
40,000
60,000
Coca-Cola69,369
Microsoft64,469
IBM51,793
GE41,731
Intel32,333
Nokia31,930
Disney30,546
McDonald's25,955
Marlboro23,339
Ford24,151
Mercedes-Benz21,288
Toyota19,111
2001
The chart consists of four parts. From bottom to top in z-order: the bars, the x-axis, the labels, and the ticker showing the current date. I’ve separated these parts so that they’ll be easier to explain individually below.

The animation iterates over each of the keyframes, delegating updates to each of the four chart components and awaiting the transition’s end. Linear easing enures the animation runs at constant speed.

(Observable aside: notebooks run in topological order, hence the chart cell above can depend on cells defined below. We write notebooks in whatever order we like and let the computer figure out how to run them. Hooray, literate programming! You can edit this notebook and the chart will re-run automatically: on invalidation, the animation is interrupted and a new one starts.)

duration = 250
You can make the animation faster or slower by adjusting the duration between keyframes in milliseconds.

Data
But what are these keyframes? Data, derived from the source data!

Take another look at the source data by inspecting the array below. Note that it does not include a rank column—we will compute it.

Array(1975) [Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, …]
For any given brand, such as Apple, there are multiple entries in the dataset: one per year. We can also see this by grouping by name.

Map(173) {"Coca-Cola" => Array(20), "Microsoft" => Array(20), "IBM" => Array(20), "Intel" => Array(20), "Nokia" => Array(15), "GE" => Array(20), "Ford" => Array(20), "Disney" => Array(20), "McDonald's" => Array(20), "AT&T" => Array(3), "Marlboro" => Array(11), "Mercedes-Benz" => Array(20), "HP" => Array(20), "Cisco" => Array(20), "Toyota" => Array(20), "Citi" => Array(20), "Gillette" => Array(20), "Sony" => Array(20), "American Express" => Array(20), "Honda" => Array(20), …}
While most brands are defined for the full duration (from 2000 to 2019), and thus have twenty entries, some brands are occasionally missing. Heineken, for instance, is missing from 2005 to 2009 because it fell out of the top 100 tracked by Interbrand.

Array(16) [Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object]
Why do we care about the top 100 when the chart only shows the top 12? Having data beyond the top 12 allows bars that enter or exit to correctly transition from the previous value or to the next value outside the top group. And besides, there’s little cost to processing the larger set. If you like, you can increase the value of n below for a bigger race.

n = 12
Here’s the full set of brand names covering twenty years. It’s larger than yearly top 100 because there’s turnover. (Farewell, Motorola, we hardly knew ye.)

names = Set(173) {"Coca-Cola", "Microsoft", "IBM", "Intel", "Nokia", "GE", "Ford", "Disney", "McDonald's", "AT&T", "Marlboro", "Mercedes-Benz", "HP", "Cisco", "Toyota", "Citi", "Gillette", "Sony", "American Express", "Honda", …}
Similarly, here’s the set of dates. But our approach here is different. We’ll construct a nested map from date and name to value. Then we’ll convert this to an array to order the data chronologically.

datevalues = Array(20) [Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2)]
(Dates are objects, so we have to do a little dance to construct the map. The dates are first coerced to numbers using + for keys, and then converted back into dates using the Date constructor.)

Now we’re ready to compute the zero-based rank for each brand. The rank function below takes a value accessor function, retrieves each brand’s value, sorts the result by descending value, and then assigns rank.

rank = ƒ(value)
Here’s an example, computing the ranked brands for the first date in the dataset. (Inspect the array below to see the result.)

Array(173) [Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, …]
Why bother with a value accessor function? Well, because we’re about to do something interesting. 🌶

Rank is an ordinal value: a brand can be rank 2 or 3, but never rank 2.345. In the source data, ranks change once per year. If we animated rank changes over the year (2.5 seconds), many bars would move up or down simultaneously, making the race hard to follow. Hence we generate interpolated frames within the year to animate rank changes more quickly (250 milliseconds), improving readability.

Try disabling interpolation by setting k to 1 below, then scroll up to see how this affects the animation.

k = 10
Since our rank helper above takes a function, so we can use it to interpolate values linearly. If 
a
a is the starting value and 
b
b is the ending value, then we vary the parameter 
t
∈
[
0
,
1
]
t∈[0,1] to compute the interpolated value 
a
(
1
−
t
)
+
b
t
a(1−t)+bt. For any missing data—remember, turnover—we treat the value as zero.

keyframes = Array(191) [Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), …]
The last data-processing step—we’re almost there!—is to prepare for enter and exit. An enter transition occurs when a brand enters the top 12, and an exit transition occurs when a brand exits the top 12.

For example, between 2001 and 2002, Toyota enters the top 12 (moving from rank 14 to 12) while AT&T exits the top 12 (moving from rank 10 to 17). When animating Toyota’s entrance, we need to know the rank that it was coming from (14), and similarly when animating AT&T’s exit, we need to know the rank it is going to (17).

nameframes = Array(173) [Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), …]
prev = Map(32870) {Object => Object, Object => Object, Object => Object, Object => Object, Object => Object, Object => Object, Object => Object, Object => Object, Object => Object, Object => Object, Object => Object, Object => Object, Object => Object, Object => Object, Object => Object, Object => Object, Object => Object, Object => Object, Object => Object, Object => Object, …}
next = Map(32870) {Object => Object, Object => Object, Object => Object, Object => Object, Object => Object, Object => Object, Object => Object, Object => Object, Object => Object, Object => Object, Object => Object, Object => Object, Object => Object, Object => Object, Object => Object, Object => Object, Object => Object, Object => Object, Object => Object, Object => Object, …}
Bars
Enough with the data. Let’s draw!

The four chart components, starting with the bars here, are implemented as functions that are passed a selection of the chart’s root SVG element. This function initializes the component, such as by adding a G element, and returns an update function which will be called repeatedly to implement transitions.

bars = ƒ(svg)
The update function applies a data-join: D3’s pattern for manipulating the DOM based on data. The key (the second argument to selection.data) is the name, ensuring that the data is bound consistently. We then use selection.join to handle enter, update and exit separately. As discussed above, when bars enter or exit, they transition from the previous value on enter or to the next value on exit.

D3 allows you to minimize DOM changes to improve performance. Hence, any attribute that is shared by all bars is applied to the parent G element (fill-opacity). And any attribute that is constant for the life of a given bar but varies between bars is assigned on enter (fill, height, x). Hence, only the minimal set of attributes are transitioned (y, width). To avoid code duplication, enter and update transitions are shared using the merged result of selection.join.

Each time the update function is called by the chart, we re-assign the bar selection to the result of selection.join, thereby maintaining the current selection of bars. We use selection.call to initiate transitions without breaking the method chain.

The parent transition is passed in by the chart, allowing the child transitions to inherit timing parameters.

Labels
As you might expect, the labels are implemented similarly to the bars.

labels = ƒ(svg)
There are two labels per bar: the name and the value; a TSPAN element is used for the latter. We set the x attribute of both elements so they are right-aligned, and use the transform attribute (and y and dy) to position text. (See the SVG specification for more on text elements.)

To transition the text labels, we use D3’s transition.textTween.

Since the value labels change sixty times per second, we use tabular figures to reduce jitter and improve readability. Try commenting out the font-variant-numeric style above to see its effect!

The function below is used to format values as whole numbers. If you want decimal values, adjust accordingly.

formatNumber = ƒ(t)
Axis
Our x-axis is top-anchored and slightly customized.

axis = ƒ(svg)
Not much to say here. We use D3’s margin convention. The suggested tick count is derived from Observable’s responsive width, so it works on both small and large screens. The tick size is negative so that the tick lines overlay the bars. And we use post-selection—modifying the elements generated by the axis—to remove the domain path and change the tick line color.

Ticker
The “ticker” in the bottom-right corner shows the current date.

ticker = ƒ(svg)
The keyframe’s date represents the date at the end of the transition; hence, the displayed date is updated when the transition.end promise resolves.

The function below is used to format dates as four-digit years. If you want a more precise display for shorter time periods, adjust as appropriate.

formatDate = ƒ(e)
Color
That concludes our chart components! Only a few odds and ends left, such as this ordinal scale mapping from category name to color. I chose the Tableau10 scheme because it is less saturated than Category10.

color = ƒ(d)
This code adapts to the data: if the data defines a category field, this field determines the color; otherwise, the name field is used. This means your replacement data can omit the category field and you’ll still have varying color, making it easier to follow bars as they move up or down.

I’ve assumed that the category for a given name never changes. If that’s not true of your data, you’ll need to change this scale implementation and implement fill transitions in the bar component above.

Position
The x-scale is linear. The chart mutates the domain as the animation runs.

x = ƒ(n)
The y-scale is a band scale, but it’s a bit unusual in that the domain covers n + 1 = 13 ranks, so that bars can enter and exit.

y = ƒ(i)
This chart’s also a little unusual in that the height is specified indirectly: it’s based on the bar height (below) and the number of bars (n). This means we can easily change the number of bars and the chart will resize automatically.

height = 598
barSize = 48
margin = Object {top: 16, right: 6, bottom: 6, left: 0}
Libraries
We’re using d3@7 for its lovely new d3.group method.

d3 = Object {format: ƒ(t), formatPrefix: ƒ(t, n), timeFormat: ƒ(t), timeParse: ƒ(t), utcFormat: ƒ(t), utcParse: ƒ(t), Adder: class, Delaunay: class, FormatSpecifier: ƒ(t), InternMap: class, InternSet: class, Node: ƒ(t), Path: class, Voronoi: class, ZoomTransform: ƒ(t, n, e), active: ƒ(t, n), arc: ƒ(), area: ƒ(t, n, e), areaRadial: ƒ(), ascending: ƒ(t, n), …}
Thanks for reading! 🙏

Please send any corrections or comments via suggestion, or let me know your thoughts and questions on Twitter.

Credit: Bar Chart Race, Explained by D3