---
id: faq
title: Frequently Asked Questions (FAQ)
---

## Muster

### What is Muster?

Muster is a data library. It's written in TypeScript and compiled into JavaScript. Muster offers a rich api for structuring data from multiple sources into a Virtual Graph. It works reactively, updating and evaluating data only when it is requested or its dependencies change. It's designed to work on both clients (web apps, `react-native` apps) and servers (through `muster-server`), and seamlessly handles communication between the two via XHR or WebSockets.

Muster lets developers co-locate transient app state alongside data from multiple end-points or persistent sources, and have UI components treat them no differently. Muster isolates side-effects and allows developers to write synchronous code irrespective of whether it will act on synchronous or asynchronous data.

### Why should I use Muster?

Muster offers a lot of advantages, but the most notable are:

- **Unified data** - Muster lets you declare your data in a structure that makes the most sense for your app, and allows you to put app state right alongside remote or persistent data and not worry about addressing them differently.
- **Rich, declarative API** - Muster offers a core set of *nodes* which provide the flexibility to describe your data exactly the way you want to.
- **Everything\* synchronous** - Muster isolates side-effecting or asynchronous code and handles its execution and resolution. Everything else within your graph can be written synchronously, and if integrating with a view framework, data will arrive pre-resolved into your components - never\*\* worry about promises or observables again!
- **Reactive updates** - Muster's graph allows references between nodes and entities, creating a tree of dependencies. Should a value change, anything that depends on it will automatically be reevaluated, all the way through to new component renders (if required).
- **Lazy evaluation** - The virtual graph at the core of Muster is exactly that - virtual. Until data is requested or required by a UI, it exists only as potential. As more data is requested, more values in the graph are resolved, and more underlying requests for source data are made.
- **Remote request aggregation** - When using Muster on the server with XHR, the Graph Server will act just as a graph would on a client: making requests for data only at the moment it is required. Should an application require data from multiple end-points simultaneously, a Muster client will still make a single request to the Graph Server, which in turn will resolve all required data needs and make a single response. When Graph Server and dependent end-points are co-located, this allows for a significant saving in request count, latency and bandwidth, which is especially beneficial for mobile clients.

### Where can I get help on Muster?

Head for the [Support](/muster/help) section.

### Do I need to use TypeScript?

No, Muster can be used just fine in a JavaScript-only app. Other languages/environments are on the way.

### Which nodes are the most important to know about?

Try the [Essential nodes](/muster/docs/resources/essential-nodes) page.

### How do I fetch data from an external source?

Take a look at [Asynchronous Data](/muster/docs/learn/async-data).

### Can Muster handle streaming data? 

It can. You can configure a streaming or observable source with the `fromStream` node in the client, which will re-evaluate every time its source emits. If you're using a streaming source on a Graph Server, you'll need to set up a WebSocket-based connection to your clients. See [Muster on the Server](/muster/docs/tutorials/muster-server) for more details.

### Is there a recommended way to structure a Muster project?

Up to you, but we tend to isolate graph/data files in a `muster` directory.

```
- <project_root>
  - ...
  - muster
    - index.js // Exports an instance of Muster application with the `graph-root.js` node as the root of your graph
    - graph-root.js // Contains the root of your graph as a Muster node
    - auth.js // Contains some imaginary auth graph
    - profile.js // Contains some imaginary profile graph
```

Splitting the `index.js` and `graph-root.js` allow you to import `graph-root` in your unit tests.

### How can I find details and examples of how each node should be used?

Check out the [API documentation](/muster/api). It's pretty exhaustive.

### Is there somewhere online I can experiment with Muster and see the results?

Sounds like the [Muster Playground](/muster/playground) may be to your tastes.

### What does this error mean...?

Why not try the [Common Muster Errors](/muster/docs/resources/common-muster-errors) page?

### How do you set up a Muster Graph Server?

Mosey on over to [Muster on the Server](/muster/docs/tutorials/muster-server) for the skinny on this.

### What view integrations are available?

Currently only `Muster-React` is officially provided, but if you'd like to use another framework [please get in touch](/muster/help). Angular, Vue or any framework that works well with reactive data should be a perfect fit.

### Can I move Muster off the main thread with a Worker?

Yes! See our guide to [Running Muster in a Worker](/muster/docs/tutorials/muster-worker)

### Where can I find some example projects that use Muster?

There's a whole repo of them at [muster-examples](https://github.com/dwstech/muster-examples). Most notable among them are probably [TodoMVC](https://github.com/dwstech/muster-examples/blob/master/todo-mvc-muster) and the [RealWorld app](https://github.com/dwstech/muster-examples/blob/master/muster-react-realworld-example-app).

---

## Muster React

### What is the difference between a local and global graph?

Local graphs are created using the container's `data` property in exactly the same way as global Muster graphs.

The distinction is that local graphs are not shared between component instances. One connected component cannot access the local graph state of another connected component, even when they are instances of the same class.

### Do I always need to use a global graph?

No, local graphs can work without a global graph. Some components may wish to use local graphs merely to isolate transient UI state.

### Can I use React's component state as well as using Muster?

You can, but we don't recommended it. Making the best use of Muster means all your state should be stored in a graph, even if that means just local graphs on UI-only components. This gives you the greatest flexibility and control, and makes later updates or refactors a breeze. 

### Does Muster React work with React-Native?

It does, and we have the scars to prove it. You should find no material difference using Muster with React-Native over React-DOM.

### Are there developer tools for Muster React?

Yes. Unfortunately, they're not yet on the Chrome/Firefox stores, but in the meantime you can **[download `muster-devtools`](/muster/muster-devtools.zip)** as a .zip and install into your browser as an unpacked extension. As things stand, you'll need to wrap your root graph definition in a `withDevTools()` from the `muster-devtools-client` package, like so:

```javascript
import muster from '@dws/muster';
import { withDevTools } from '@dws/muster-devtools-client';

export default () => {
  return withDevTools(
    'App Name',
    muster({
      // ...
    }),
  );
};
```

### Is there a recommended folder structure for a Muster React project?

Again, your mileage may vary, but we've had good results with variations on the following:

```
- <project_root>
  - components // React components
    - component1
      - component1.js // The render component in isolation
      - component1.container.js // The Muster container
      - index.js // the export of the connected component
    - component2
      - ...
  // Muster graph
  - muster
    - index.js // Exports an instance of Muster application with the `graph-root.js` node as the root of your graph
    - graph-root.js // Contains the root of your graph as a Muster node
    - auth.js // Contains some imaginary auth graph
    - profile.js // Contains some imaginary profile graph
```

Keeping the container and the render components separate allows for easier testing of each. Likewise, splitting the `index.js` and `graph-root.js` allow you to import `graph-root` in your unit tests.

---

\* Asynchronous code still exists but is isolated by the `fromPromise` or `fromStream` nodes

\*\* Some worry may still be required for reasons beyond our control
