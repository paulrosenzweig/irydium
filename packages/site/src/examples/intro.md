---
scripts:
  [
    "https://d3js.org/d3-dsv.v1.min.js",
    "https://cdn.jsdelivr.net/npm/vega@5",
    "https://cdn.jsdelivr.net/npm/vega-lite@5",
    "https://cdn.jsdelivr.net/npm/vega-embed/build/vega-embed.js",
  ]
data:
  - eviction_notice_csv: https://data.sfgov.org/api/views/5cei-gny5/rows.csv?accessType=DOWNLOAD
---

# Irydium prototype

This is a basic Irydium document, designed to demonstrate some of the concepts of this
project. In some ways Irydium will feel familiar to those coming from environments
like [Jupyter](https://jupyter.org/), but it is more focused on _reproducible
presentation_. For more information, see the [project README].

This introduction is best viewed side-by-side with its markdown representation,
so you can see how what you write gets rendered to the screen.

For a nice, simple demo, let's pull down some data and render it using [vega-embed],
a popular JavaScript visualization library. This will show some basic workflows that irydium
makes possible.

If you're viewing this in markdown mode, you'll see in the header right on top, which looks like this:

```yaml
scripts:
  [
    "https://d3js.org/d3-dsv.v1.min.js",
    "https://cdn.jsdelivr.net/npm/vega@5",
    "https://cdn.jsdelivr.net/npm/vega-lite@5",
    "https://cdn.jsdelivr.net/npm/vega-embed/build/vega-embed.js",
  ]
data:
  - eviction_notice_csv: https://data.sfgov.org/api/views/5cei-gny5/rows.csv?accessType=DOWNLOAD
```

The first is a set of scripts to load. In this case, we're loading a [d3-dsv], to load a CSV file
(more on that in a second) as well as the scripts necessary to load the vega-embed library.

The second block describes data that we want to load. `eviction_notice_csv` as the name implies, is
a CSV containing a database of collected eviction notices from the San Francisco government.

One of the main ideas in Irydium is the _task list_. Individual tasks have `inputs` (dependencies)
and `outputs` (which can either be used as inputs in subsequent tasks _or_ presented in the final output
in some way). An irydium document resolves these dependencies at run time, starting with those with no inputs.
Both the "data" and "scripts" objects we discussed are examples of this type of input.

One place where this model is particularly useful is creating a pipeline of ETL (extract-transform-load) operations.
The eviction notice dataset is in CSV format which irydium doesn't natively understand: we will want to process it into a set of JavaScript objects. Let's create a code cell to do this, using the data we just downloaded as an input:

```{code-cell} js
---
inputs: [ "eviction_notice_csv" ]
output: "eviction_notices"
inline: true
---
let eviction_notice_text = await eviction_notice_csv.text();
console.log(eviction_notice_text.slice(0, 1024));
let parsed = d3.csvParse(eviction_notice_text);
return parsed;
```

A couple of things to note about this:

- You can see that the above cell has YAML-based frontmatter. `inputs` and `output` were discussed above,
  `inline` tells irydium that it should also output the content of the code chunk into the resulting
  document (by default, it hides code chunk -- in line with the philosophy that a rendered irydium document
  should be optimized for reading).
- You can see a call to `console.log` in the output above. This will appear in your browser's developer
  console and can be handy when debugging (using a debugger should also work fine).

Now that we have some prepared data, we can try to do something with it. Let's do a count of eviction
notices by year. We'll write up some basic JavaScript to do some map-reduce operations here to get this
output:

```{code-cell} js
---
inputs: [eviction_notices]
output: eviction_notices_per_year
inline: true
---
const years = eviction_notices.map(n=> {
  return n["File Date"].split("/")[2];
});
const yearCounts = years.reduce((acc, y) => { return acc[y] === undefined ? {...acc, [y]: 1} : {...acc, [y]: acc[y]+1} }, {})
const yearArray = Object.keys(yearCounts).map(year => ({year, count: yearCounts[year]}));
console.log(yearArray);
return yearArray;
```

Finally, we'll want to display the results. Soon we may allow a JavaScript code cell in Irydium to return an
SVG or HTML element which means we could call Vega-Embed directly, however for now the best way of doing
this is by creating a Svelte component and calling the visualization library inside there. If you're not
familiar with Svelte, it's a fantastic library for quickly building interactive web sites using a syntax
that should feel very familiar if you know even a little bit of HTML, CSS, and JavaScript. Irydium uses
the [mdsvex] library to allow freely mixing Svelte syntax with markdown. Let's give it a go:

```{code-cell} svelte
---
name: VegaEmbed
inline: true
---
<script>
  import { onMount } from 'svelte';

  export let spec = undefined;
  let dom_node;

  onMount(() => {
    console.log(dom_node);
    vegaEmbed(dom_node, spec)    	// result.view provides access to the Vega View API
      .then(result => console.log(result))
      .catch(console.warn);
  });
</script>

<!-- Weird CSS issue with vegaEmbed, it seems to want height to be 100% -->
<div style="height: 320px">
  <div bind:this={dom_node}></div>
</div>
```

We'll need to create a vegalite spec to define how the graph should be represented, let's set that up too:

```{code-cell} js
---
inputs: [eviction_notices_per_year]
output: vegaspec
inline: true
---

return {
  "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
  "description": "A simple bar chart with embedded data.",
  "width": 600,
  "data": {
    "values": eviction_notices_per_year
  },
  "mark": "bar",
  "encoding": {
    "x": {"field": "year", "type": "ordinal"},
    "y": {"field": "count", "type": "quantitative"},
    "tooltip": {"field": "count", "type": "quantitative"}
  }
}
```

Finally, let's insert this into the document by inserting a `&lt;VegaEmbed /&gt;` element:

## Eviction counts in San Francisco by Year

<VegaEmbed spec={vegaspec} />

🎉 You now understand the basics of creating a visualization with explanatory text using irydium.

[project readme]: https://github.com/irydium/irydium/blob/main/README.md
[vega-embed]: https://github.com/vega/vega-embed
[d3-dsv]: https://github.com/d3/d3-dsv
[mdsvex]: https://mdsvex.com/