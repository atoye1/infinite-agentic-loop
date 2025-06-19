TITLE: Performing Data Operations in Node.js with Danfo.js
DESCRIPTION: This JavaScript snippet illustrates how to use Danfo.js in a Node.js environment to read a CSV file. It demonstrates a wide range of data manipulation tasks including printing the head, calculating descriptive statistics, checking data shape and columns, inferring dtypes, selecting and dropping columns, selecting by dtypes, adding new columns, calculating value counts, printing the tail, and summing missing values.
SOURCE: <https://github.com/javascriptdata/danfojs/blob/dev/src/danfojs-node/README.md#_snippet_6>

LANGUAGE: JavaScript
CODE:

```
const dfd = require("danfojs-node")

const file_url = "https://web.stanford.edu/class/archive/cs/cs109/cs109.1166/stuff/titanic.csv"
dfd.readCSV(file_url)
    .then(df => {
        //prints the first five columns
        df.head().print()

        // Calculate descriptive statistics for all numerical columns
        df.describe().print()

        //prints the shape of the data
        console.log(df.shape);

        //prints all column names
        console.log(df.columns);

        // //prints the inferred dtypes of each column
        df.ctypes.print()

        //selecting a column by subsetting
        df['Name'].print()

        //drop columns by names
        cols_2_remove = ['Age', 'Pclass']
        df_drop = df.drop({ columns: cols_2_remove, axis: 1 })
        df_drop.print()


        //select columns by dtypes
        let str_cols = df_drop.selectDtypes(["string"])
        let num_cols = df_drop.selectDtypes(["int32", "float32"])
        str_cols.print()
        num_cols.print()


        //add new column to Dataframe

        let new_vals = df['Fare'].round(1)
        df_drop.addColumn("fare_round", new_vals, { inplace: true })
        df_drop.print()

        df_drop['fare_round'].round(2).print(5)

        //prints the number of occurence each value in the column
        df_drop['Survived'].valueCounts().print()

        //print the last ten elementa of a DataFrame
        df_drop.tail(10).print()

        //prints the number of missing values in a DataFrame
        df_drop.isNa().sum().print()

    }).catch(err => {
        console.log(err);
    })
```

----------------------------------------

TITLE: Data Manipulation and Analysis in Node.js with Danfo.js
DESCRIPTION: This JavaScript snippet showcases various data manipulation and analysis capabilities of Danfo.js in a Node.js environment. It loads a CSV file, prints the head, calculates descriptive statistics, displays data shape and column names, infers data types, selects and drops columns, adds new columns, counts value occurrences, prints tail elements, and sums missing values. Error handling is included.
SOURCE: <https://github.com/javascriptdata/danfojs/blob/dev/src/danfojs-browser/README.md#_snippet_4>

LANGUAGE: JavaScript
CODE:

```
const dfd = require("danfojs-node")

const file_url = "https://web.stanford.edu/class/archive/cs/cs109/cs109.1166/stuff/titanic.csv"
dfd.readCSV(file_url)
    .then(df => {
        //prints the first five columns
        df.head().print()

        // Calculate descriptive statistics for all numerical columns
        df.describe().print()

        //prints the shape of the data
        console.log(df.shape);

        //prints all column names
        console.log(df.columns);

        // //prints the inferred dtypes of each column
        df.ctypes.print()

        //selecting a column by subsetting
        df['Name'].print()

        //drop columns by names
        cols_2_remove = ['Age', 'Pclass']
        df_drop = df.drop({ columns: cols_2_remove, axis: 1 })
        df_drop.print()


        //select columns by dtypes
        let str_cols = df_drop.selectDtypes(["string"])
        let num_cols = df_drop.selectDtypes(["int32", "float32"])
        str_cols.print()
        num_cols.print()


        //add new column to Dataframe

        let new_vals = df['Fare'].round(1)
        df_drop.addColumn("fare_round", new_vals, { inplace: true })
        df_drop.print()

        df_drop['fare_round'].round(2).print(5)

        //prints the number of occurence each value in the column
        df_drop['Survived'].valueCounts().print()

        //print the last ten elementa of a DataFrame
        df_drop.tail(10).print()

        //prints the number of missing values in a DataFrame
        df_drop.isNa().sum().print()

    }).catch(err => {
        console.log(err);
    })
```

----------------------------------------

TITLE: Data Manipulation and Analysis in Node.js with Danfo.js
DESCRIPTION: This JavaScript snippet illustrates how to use Danfo.js in a Node.js environment to read a CSV file. It demonstrates various data manipulation operations such as printing the head, calculating descriptive statistics, checking shape and column names, inferring dtypes, selecting and dropping columns, adding new columns, counting value occurrences, and identifying missing values.
SOURCE: <https://github.com/javascriptdata/danfojs/blob/dev/README.md#_snippet_4>

LANGUAGE: JavaScript
CODE:

```
const dfd = require("danfojs-node");

const file_url =
  "https://web.stanford.edu/class/archive/cs/cs109/cs109.1166/stuff/titanic.csv";
dfd
  .readCSV(file_url)
  .then((df) => {
    //prints the first five columns
    df.head().print();

    // Calculate descriptive statistics for all numerical columns
    df.describe().print();

    //prints the shape of the data
    console.log(df.shape);

    //prints all column names
    console.log(df.columns);

    // //prints the inferred dtypes of each column
    df.ctypes.print();

    //selecting a column by subsetting
    df["Name"].print();

    //drop columns by names
    let cols_2_remove = ["Age", "Pclass"];
    let df_drop = df.drop({ columns: cols_2_remove, axis: 1 });
    df_drop.print();

    //select columns by dtypes
    let str_cols = df_drop.selectDtypes(["string"]);
    let num_cols = df_drop.selectDtypes(["int32", "float32"]);
    str_cols.print();
    num_cols.print();

    //add new column to Dataframe

    let new_vals = df["Fare"].round(1);
    df_drop.addColumn("fare_round", new_vals, { inplace: true });
    df_drop.print();

    df_drop["fare_round"].round(2).print(5);

    //prints the number of occurence each value in the column
    df_drop["Survived"].valueCounts().print();

    //print the last ten elementa of a DataFrame
    df_drop.tail(10).print();

    //prints the number of missing values in a DataFrame
    df_drop.isNa().sum().print();
  })
  .catch((err) => {
    console.log(err);
  });
```

----------------------------------------

TITLE: Loading and Plotting CSV Data in Browser with Danfo.js
DESCRIPTION: This HTML snippet demonstrates how to load the Danfo.js library in a web browser and use it to read a CSV file from a URL. It then performs data visualization by creating a box plot, displaying the data as a table, and generating a time-series line plot based on specific columns, handling potential errors during data loading.
SOURCE: <https://github.com/javascriptdata/danfojs/blob/dev/README.md#_snippet_3>

LANGUAGE: HTML
CODE:

```
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://cdn.jsdelivr.net/npm/danfojs@1.1.2/lib/bundle.js"></script>

    <title>Document</title>
  </head>

  <body>
    <div id="div1"></div>
    <div id="div2"></div>
    <div id="div3"></div>

    <script>

      dfd.readCSV("https://raw.githubusercontent.com/plotly/datasets/master/finance-charts-apple.csv")
          .then(df => {

              df['AAPL.Open'].plot("div1").box() //makes a box plot

              df.plot("div2").table() //display csv as table

              new_df = df.setIndex({ column: "Date", drop: true }); //resets the index to Date column
              new_df.head().print() //
              new_df.plot("div3").line({
                  config: {
                      columns: ["AAPL.Open", "AAPL.High"]
                  }
              })  //makes a timeseries plot

          }).catch(err => {
              console.log(err);
          })
    </script>
  </body>
</html>
```

----------------------------------------

TITLE: Loading and Plotting CSV Data in Browser with Danfo.js
DESCRIPTION: This HTML snippet demonstrates how to load a CSV file from a URL using Danfo.js in a web browser. It then performs several data operations: creating a box plot, displaying the data as an HTML table, resetting the DataFrame index, and generating a time-series line plot. It handles potential errors during data loading.
SOURCE: <https://github.com/javascriptdata/danfojs/blob/dev/src/danfojs-browser/README.md#_snippet_3>

LANGUAGE: HTML
CODE:

```
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://cdn.jsdelivr.net/npm/danfojs@1.2.0/lib/bundle.js"></script>

    <title>Document</title>
  </head>

  <body>
    <div id="div1"></div>
    <div id="div2"></div>
    <div id="div3"></div>

    <script>

      dfd.readCSV("https://raw.githubusercontent.com/plotly/datasets/master/finance-charts-apple.csv")
          .then(df => {

              df['AAPL.Open'].plot("div1").box() //makes a box plot

              df.plot("div2").table() //display csv as table

              new_df = df.setIndex({ column: "Date", drop: true }); //resets the index to Date column
              new_df.head().print() //
              new_df.plot("div3").line({
                  config: {
                      columns: ["AAPL.Open", "AAPL.High"]
                  }
              })  //makes a timeseries plot

          }).catch(err => {
              console.log(err);
          })
    </script>
  </body>
</html>
```

----------------------------------------

TITLE: Loading and Visualizing Data in Browser with Danfo.js
DESCRIPTION: This HTML snippet demonstrates how to load the Danfo.js library in a browser environment and use it to read a CSV file. It then performs various data operations such as creating a box plot, displaying data as a table, resetting the DataFrame index, and generating a time-series line plot, all rendered within specified div elements.
SOURCE: <https://github.com/javascriptdata/danfojs/blob/dev/src/danfojs-node/README.md#_snippet_5>

LANGUAGE: HTML
CODE:

```
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://cdn.jsdelivr.net/npm/danfojs@1.2.0/lib/bundle.js"></script>

    <title>Document</title>
  </head>

  <body>
    <div id="div1"></div>
    <div id="div2"></div>
    <div id="div3"></div>

    <script>

      dfd.readCSV("https://raw.githubusercontent.com/plotly/datasets/master/finance-charts-apple.csv")
          .then(df => {

              df['AAPL.Open'].plot("div1").box() //makes a box plot

              df.plot("div2").table() //display csv as table

              new_df = df.setIndex({ column: "Date", drop: true }); //resets the index to Date column
              new_df.head().print() //
              new_df.plot("div3").line({
                  config: {
                      columns: ["AAPL.Open", "AAPL.High"]
                  }
              })  //makes a timeseries plot

          }).catch(err => {
              console.log(err);
          })
    </script>
  </body>
</html>
```

----------------------------------------

TITLE: Installing Danfo.js for Client-Side Applications
DESCRIPTION: This snippet shows how to install the client-side version of Danfo.js using npm or Yarn. This is intended for front-end applications built with frameworks like React, Vue, or Next.js.
SOURCE: <https://github.com/javascriptdata/danfojs/blob/dev/src/danfojs-browser/README.md#_snippet_1>

LANGUAGE: Bash
CODE:

```
npm install danfojs

or

yarn add danfojs
```

----------------------------------------

TITLE: Installing Danfo.js for Client-Side Applications
DESCRIPTION: This snippet shows how to install the `danfojs` package for client-side applications built with frameworks like React, Vue, or Next.js, using npm or yarn. This version is suitable for browser-based data manipulation.
SOURCE: <https://github.com/javascriptdata/danfojs/blob/dev/README.md#_snippet_1>

LANGUAGE: Bash
CODE:

```
npm install danfojs
```

LANGUAGE: Bash
CODE:

```
yarn add danfojs
```

----------------------------------------

TITLE: Installing Danfo.js for Node.js Applications
DESCRIPTION: This snippet demonstrates how to install the `danfojs-node` package, specifically designed for Node.js environments, using either npm or yarn. This version is optimized for server-side data processing.
SOURCE: <https://github.com/javascriptdata/danfojs/blob/dev/README.md#_snippet_0>

LANGUAGE: Bash
CODE:

```
npm install danfojs-node
```

LANGUAGE: Bash
CODE:

```
yarn add danfojs-node
```

----------------------------------------

TITLE: Installing Danfo.js for Client-Side with npm
DESCRIPTION: This command installs the `danfojs` package for client-side applications (e.g., React, Vue, Next.js) using npm. This version is suitable for browser-based data analysis.
SOURCE: <https://github.com/javascriptdata/danfojs/blob/dev/src/danfojs-node/README.md#_snippet_2>

LANGUAGE: bash
CODE:

```
npm install danfojs
```

----------------------------------------

TITLE: Installing Danfo.js for Node.js using npm or Yarn
DESCRIPTION: This snippet demonstrates how to install the Node.js version of Danfo.js using either npm or Yarn package managers. This is suitable for backend applications or command-line tools built with Node.js.
SOURCE: <https://github.com/javascriptdata/danfojs/blob/dev/src/danfojs-browser/README.md#_snippet_0>

LANGUAGE: Bash
CODE:

```
npm install danfojs-node

or

yarn add danfojs-node
```

----------------------------------------

TITLE: Installing Danfo.js for Node.js with npm
DESCRIPTION: This command installs the `danfojs-node` package, which is specifically designed for Node.js applications, using the npm package manager. It provides server-side data analysis capabilities.
SOURCE: <https://github.com/javascriptdata/danfojs/blob/dev/src/danfojs-node/README.md#_snippet_0>

LANGUAGE: bash
CODE:

```
npm install danfojs-node
```

----------------------------------------

TITLE: Installing Danfo.js for Node.js with Yarn
DESCRIPTION: This command installs the `danfojs-node` package, optimized for Node.js environments, using the Yarn package manager. It's an alternative to npm for managing project dependencies.
SOURCE: <https://github.com/javascriptdata/danfojs/blob/dev/src/danfojs-node/README.md#_snippet_1>

LANGUAGE: bash
CODE:

```
yarn add danfojs-node
```

----------------------------------------

TITLE: Installing Danfo.js for Client-Side with Yarn
DESCRIPTION: This command installs the `danfojs` package for client-side web applications using the Yarn package manager. It provides browser-compatible data analysis functionalities.
SOURCE: <https://github.com/javascriptdata/danfojs/blob/dev/src/danfojs-node/README.md#_snippet_3>

LANGUAGE: bash
CODE:

```
yarn add danfojs
```

----------------------------------------

TITLE: Including Danfo.js in HTML via CDN
DESCRIPTION: This HTML snippet illustrates how to directly include the Danfo.js library into an HTML file using a script tag from the JsDelivr CDN. This method is convenient for quick prototyping or simple web pages without a complex build setup.
SOURCE: <https://github.com/javascriptdata/danfojs/blob/dev/README.md#_snippet_2>

LANGUAGE: HTML
CODE:

```
<script src="https://cdn.jsdelivr.net/npm/danfojs@1.1.2/lib/bundle.js"></script>
```

----------------------------------------

TITLE: Including Danfo.js in HTML via CDN
DESCRIPTION: This HTML snippet demonstrates how to directly include the Danfo.js library in an HTML file using a script tag from JsDelivr CDN. This method is useful for quick prototyping or simple web pages without a build system.
SOURCE: <https://github.com/javascriptdata/danfojs/blob/dev/src/danfojs-browser/README.md#_snippet_2>

LANGUAGE: HTML
CODE:

```
<script src="https://cdn.jsdelivr.net/npm/danfojs@1.2.0/lib/bundle.js"></script>
```

----------------------------------------

TITLE: Including Danfo.js via CDN in HTML
DESCRIPTION: This HTML script tag directly includes the Danfo.js library from JsDelivr CDN into an HTML file. It allows immediate use of Danfo.js functionalities in a web browser without a build step.
SOURCE: <https://github.com/javascriptdata/danfojs/blob/dev/src/danfojs-node/README.md#_snippet_4>

LANGUAGE: html
CODE:

```
<script src="https://cdn.jsdelivr.net/npm/danfojs@1.2.0/lib/bundle.js"></script>
```
