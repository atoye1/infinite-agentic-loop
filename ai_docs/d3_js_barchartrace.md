Bar Chart Race, Explained
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