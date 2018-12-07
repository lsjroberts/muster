---
id: version-6.5.0-overview
title: Muster
sidebar_label: Muster Overview
original_id: overview
---

### A universal, graph-structured data layer for front-end components and back-end services

Muster is a reactive state and data management library that gives you a unified view of as much or as little data as you need.

It can handle UI component state and help combine all your backend APIs into a unified graph. Muster is a single language for front-end and back-end which enables code to be shared and moved easily between client and server.

The below code snippet introduces you to what a Muster graph can look like, and gives you the opportunity to experiment with it by following the link to the Muster Playground.

```javascript
// Define your graph
{
  greeting: 'Hello, world!',
  user: 'world',
  welcome: format('${salutation}, ${name}!', {
    salutation: ref('greeting'),
    name: ref('user'),
  }),
}
```

```javascript
// Request a node
ref('welcome')
```

```javascript
// Get the output
"Hello, world!"
```

[Edit on Muster Playground][1]


## Data Graph

Muster organises your data into a graph of nodes.

```javascript
{
  en: {
    greeting: 'Hello',
    name: 'World',
  },
  de: {
    greeting: 'Guten Tag',
    name: 'Welt',
  },
}
```

```javascript
ref('en', 'greeting');
```

```javascript
"Hello"
```

A node can also reference other nodes that use `ref()`.

```javascript
{
  lang: ref('enUS'),
  en: {
    greeting: 'Hello',
    name: 'World',
  },
  enUS: {
    greeting: 'Howdy',
    name: ref('en', 'name'),
  },
}
```

```javascript
ref('lang', 'name');
```

```javascript
"World"
```

[Edit on Muster Playground][2]

We can create a node that depends on others with the `computed()` node.

```javascript
{
  lang: ref('de'),
  de: {
    greeting: 'Guten Tag',
    name: 'Welt',
  },
  welcome: computed(
    [
      ref('lang', 'greeting'),
      ref('lang', 'name'),
    ],
    (greeting, name) => `${greeting}, ${name}!`
  ),
}
```

```javascript
ref('welcome');
```

```javascript
"Guten Tag, Welt!"
```

[Edit on Muster Playground][3]

So far, our graph has been static, our node values are constants. We can wrap a node's default value in the `variable()` node to allow it to be modified. Any time one of the dependencies change, the computed node will automatically update to match.

```javascript
{
  en: {
    greeting: 'Hello',
    name: variable('World'),
  },
  welcome: computed(
    [
      ref('en', 'greeting'),
      ref('en', 'name'),
    ],
    (greeting, name) => `${greeting}, ${name}!`
  ),
}
```

```javascript
set(ref('en', 'name'), 'Muster');
ref('welcome');
```

```javascript
"Hello, Muster!"
```

[Edit on Muster Playground][4]


### Virtual Graph

The graph is virtual, in that its nodes are not resolved until they are requested. This enables us to work with billions of potential nodes without issue.

For example, we could have a node for every integer to determine if it is even or not.

```javascript
{
  [match(types.integer, 'i')]: {
    isEven: computed(
      [param('i')],
      (i) => i % 2 === 0
    )
  }
}
```

```javascript
ref(2147483647, 'isEven')

//output
false
```

[Edit on Muster Playground][5]

We can also do this recursively.

```javascript
{
  [match(types.integer, 'i')]: {
    fibonacci: computed(
      [param('i')],
      (i) => (
        i < 2
          ? i
          : add(ref(i - 1, 'fibonacci'), ref(i - 2, 'fibonacci'))
      )
    )
  }
}
```

```javascript
ref(100, 'fibonacci')

354224848179262000000
```

[Edit on Muster Playground][6]


## Asynchronous & Streaming Data

A powerful feature of Muster is that synchronous and asynchronous data are both handled in the same manner.

For example, a computed node that depends on an asynchronous node can be written as though it is synchronous.

```javascript
{
  user: {
    name: fromPromise(() =>
      fetch('https://jsonplaceholder.typicode.com/users/1')
        .then((res) => res.json())
        .then((user) => user.name)
    ),
  },
  welcome: computed(
    [ref('user', 'name')],
    (name) => `Hello, ${name}!`
  )
}
```

```javascript
ref('welcome')
```

```javascript
"Hello, Leanne Graham!"
```

[Edit on Muster Playground][7]


## Integration with View Frameworks

Muster is suitable to be used with any view framework that can work well with reactive data.

An integration with React is provided and explored in the tutorials. Other view frameworks such as Angular and Vue can be integrated, but no official packages are currently provided. If you are interested in using these with Muster, [please get in touch](/muster/help).


[1]: /muster/playground/?toggles=eyJzaG93R3JhcGgiOnRydWUsInNob3dRdWVyeSI6dHJ1ZSwic2hvd1F1ZXJ5UmVzdWx0Ijp0cnVlLCJzaG93Q29udGFpbmVyIjpmYWxzZSwic2hvd1ZpZXciOmZhbHNlLCJzaG93Vmlld1Jlc3VsdCI6ZmFsc2V9&graph=IntcbiAgZ3JlZXRpbmc6ICdIZWxsbycsXG4gIHVzZXI6ICd3b3JsZCcsXG4gIHdlbGNvbWU6IGZvcm1hdCgnJHtzYWx1dGF0aW9ufSwgJHtuYW1lfSEnLCB7XG4gICAgc2FsdXRhdGlvbjogcmVmKCdncmVldGluZycpLFxuICAgIG5hbWU6IHJlZigndXNlcicpLFxuICB9KSxcbn0i
[2]: /muster/playground/?toggles=eyJzaG93R3JhcGgiOnRydWUsInNob3dRdWVyeSI6dHJ1ZSwic2hvd1F1ZXJ5UmVzdWx0Ijp0cnVlLCJzaG93Q29udGFpbmVyIjpmYWxzZSwic2hvd1ZpZXciOmZhbHNlLCJzaG93Vmlld1Jlc3VsdCI6ZmFsc2V9&graph=IntcbiAgbGFuZzogcmVmKCdlblVTJyksXG4gIGVuOiB7XG4gICAgZ3JlZXRpbmc6ICdIZWxsbycsXG4gICAgbmFtZTogJ1dvcmxkJyxcbiAgfSxcbiAgZW5VUzoge1xuICAgIGdyZWV0aW5nOiAnSG93ZHknLFxuICAgIG5hbWU6IHJlZignZW4nLCAnbmFtZScpLFxuICB9LFxufSI%3D&query=InJlZignbGFuZycsICduYW1lJyk7Ig%3D%3D
[3]: /muster/playground/?toggles=eyJzaG93R3JhcGgiOnRydWUsInNob3dRdWVyeSI6dHJ1ZSwic2hvd1F1ZXJ5UmVzdWx0Ijp0cnVlLCJzaG93Q29udGFpbmVyIjpmYWxzZSwic2hvd1ZpZXciOmZhbHNlLCJzaG93Vmlld1Jlc3VsdCI6ZmFsc2V9&graph=IntcbiAgbGFuZzogcmVmKCdkZScpLFxuICBkZToge1xuICAgIGdyZWV0aW5nOiAnR3V0ZW4gVGFnJyxcbiAgICBuYW1lOiAnV2VsdCcsXG4gIH0sXG4gIHdlbGNvbWU6IGNvbXB1dGVkKFxuICAgIFtcbiAgICAgIHJlZignbGFuZycsICdncmVldGluZycpLFxuICAgICAgcmVmKCdsYW5nJywgJ25hbWUnKSxcbiAgICBdLFxuICAgIChncmVldGluZywgbmFtZSkgPT4gYCR7Z3JlZXRpbmd9LCAke25hbWV9IWBcbiAgKSxcbn0i&query=InJlZignd2VsY29tZScpOyI%3D
[4]: /muster/playground/?toggles=eyJzaG93R3JhcGgiOnRydWUsInNob3dRdWVyeSI6dHJ1ZSwic2hvd1F1ZXJ5UmVzdWx0Ijp0cnVlLCJzaG93Q29udGFpbmVyIjpmYWxzZSwic2hvd1ZpZXciOmZhbHNlLCJzaG93Vmlld1Jlc3VsdCI6ZmFsc2V9&graph=IntcbiAgZW46IHtcbiAgICBncmVldGluZzogJ0hlbGxvJyxcbiAgICBuYW1lOiB2YXJpYWJsZSgnV29ybGQnKSxcbiAgfSxcbiAgd2VsY29tZTogY29tcHV0ZWQoXG4gICAgW1xuICAgICAgcmVmKCdlbicsICdncmVldGluZycpLFxuICAgICAgcmVmKCdlbicsICduYW1lJyksXG4gICAgXSxcbiAgICAoZ3JlZXRpbmcsIG5hbWUpID0%2BIGAke2dyZWV0aW5nfSwgJHtuYW1lfSFgXG4gICksXG59Ig%3D%3D&query=InNlcmllcyhbXG4gICAgc2V0KHJlZignZW4nLCAnbmFtZScpLCAnTXVzdGVyJyksXG4gICAgcmVmKCd3ZWxjb21lJylcbl0pXG4i
[5]: /muster/playground/?toggles=eyJzaG93R3JhcGgiOnRydWUsInNob3dRdWVyeSI6dHJ1ZSwic2hvd1F1ZXJ5UmVzdWx0Ijp0cnVlLCJzaG93Q29udGFpbmVyIjpmYWxzZSwic2hvd1ZpZXciOmZhbHNlLCJzaG93Vmlld1Jlc3VsdCI6ZmFsc2V9&graph=IntcbiAgW21hdGNoKHR5cGVzLmludGVnZXIsICdpJyldOiB7XG4gICAgaXNFdmVuOiBjb21wdXRlZChcbiAgICAgIFtwYXJhbSgnaScpXSxcbiAgICAgIChpKSA9PiBpICUgMiA9PT0gMFxuICAgIClcbiAgfVxufSI%3D&query=InJlZigyMTQ3NDgzNjQ3LCAnaXNFdmVuJyki
[6]: /muster/playground/?toggles=eyJzaG93R3JhcGgiOnRydWUsInNob3dRdWVyeSI6dHJ1ZSwic2hvd1F1ZXJ5UmVzdWx0Ijp0cnVlLCJzaG93Q29udGFpbmVyIjpmYWxzZSwic2hvd1ZpZXciOmZhbHNlLCJzaG93Vmlld1Jlc3VsdCI6ZmFsc2V9&graph=IntcbiAgW21hdGNoKHR5cGVzLmludGVnZXIsICdpJyldOiB7XG4gICAgZmlib25hY2NpOiBjb21wdXRlZChcbiAgICAgIFtwYXJhbSgnaScpXSxcbiAgICAgIChpKSA9PiAoXG4gICAgICAgIGkgPCAyXG4gICAgICAgICAgPyBpXG4gICAgICAgICAgOiBhZGQocmVmKGkgLSAxLCAnZmlib25hY2NpJyksIHJlZihpIC0gMiwgJ2ZpYm9uYWNjaScpKVxuICAgICAgKVxuICAgIClcbiAgfVxufSI%3D&query=InJlZigxMDAsICdmaWJvbmFjY2knKSI%3D
[7]: /muster/playground/?toggles=eyJzaG93R3JhcGgiOnRydWUsInNob3dRdWVyeSI6dHJ1ZSwic2hvd1F1ZXJ5UmVzdWx0Ijp0cnVlLCJzaG93Q29udGFpbmVyIjpmYWxzZSwic2hvd1ZpZXciOmZhbHNlLCJzaG93Vmlld1Jlc3VsdCI6ZmFsc2V9&graph=IntcbiAgdXNlcjoge1xuICAgIG5hbWU6IGZyb21Qcm9taXNlKCgpID0%2BXG4gICAgICBmZXRjaCgnaHR0cHM6Ly9qYXZhc2NyaXB0b25wbGFjZWhvbGRlci50eXBpY29kZS5jb20vdXNlcnMvMScpXG4gICAgICAgIC50aGVuKChyZXMpID0%2BIHJlcy5qYXZhc2NyaXB0b24oKSlcbiAgICAgICAgLnRoZW4oKHVzZXIpID0%2BIHVzZXIubmFtZSlcbiAgICApLFxuICB9LFxuICB3ZWxjb21lOiBjb21wdXRlZChcbiAgICBbcmVmKCd1c2VyJywgJ25hbWUnKV0sXG4gICAgKG5hbWUpID0%2BIGBIZWxsbywgJHtuYW1lfSFgXG4gIClcbn1cbiI%3D&query=InJlZignd2VsY29tZScpIg%3D%3D
