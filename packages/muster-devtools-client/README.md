# @dws/muster-repl

## Introduction 
A REPL for the Muster library.

## Installation

```bash
npm install -g @dws/muster-repl@next
```

## Usage
To start the Muster REPL simply run:
```shell
muster-repl
```

Muster REPL supports following commands:
* `<graph_node>` - evaluate a graph node
* `subscribe <graph_node>` - subscribe to a graph node
* `sub <graph_node>` - alias for the `subscribe`
* `subscribe:<name> <graph_node>` - subscribe to a graph node and name the subscription
* `unsubscribe <name>` - remove a named subscription
* `unsub <name>` - alias for the `unsubscribe`
* `subscriptions` - list all open subscriptions and their values
* `subs` - alias for the `subscriptions`
* `load <file_path>` - load an external muster graph 

### Example REPL queries
```shell
Muster version: 5.0.0-rc.6
Muster REPL version: 5.0.0-rc.6

> value('Hello, world')
'value({value: "Hello, world"})'
> computed([value('world')], (name) => `Hello, ${name}`)
'value({value: "Hello, world"})'
> muster({ name: 'Bob' })
'Created a new muster instance.'
> ref('name')
'value({value: "Bob"})'
```


### Open and close subscriptions
```shell
Muster version: 5.0.0-rc.6
Muster REPL version: 5.0.0-rc.6

> muster({ name: variable('Bob') })
'Created a new muster instance.'
> subscribe ref('name')
Subscription 1:  value({value: "Bob"})
'Subscription "1" opened'
> set('name', 'Jane')
Subscription 1:  value({value: "Jane"})
'value({value: "Jane"})'
> unsubscribe 1
'Subscription "1" closed.'
```

### Named subscriptions
```bash
Muster version: 5.0.0-rc.6
Muster REPL version: 5.0.0-rc.6

> muster({ name: variable('Bob') })
'Created a new muster instance.'
> subscribe:userName ref('name')
Subscription userName:  value({value: "Bob"})
'Subscription "userName" opened'
> unsubscribe userName
'Subscription "userName" closed.'
```

### List open subscriptions
```bash
Muster version: 5.0.0-rc.6
Muster REPL version: 5.0.0-rc.6

> subscriptions
'No open subscriptions.'
> subscribe value('asdf')
Subscription 1:  value({value: "asdf"})
'Subscription "1" opened'
> subscriptions
ID "1": value('asdf')
Last value: value({value: "asdf"})
undefined
```

### Load external muster graph
Given a graph.js:
```js
module.exports = muster({
  firstName: variable('Jane'),
  lastName: variable('Doe'),
  fullName: computed(
    [ref('firstName'), ref('lastName')],
    (firstName, lastName) => `${firstName} ${lastName}`,
  ),
});
```
You can load that file in REPL:
```bash
Muster version: 5.0.0-rc.7
Muster REPL version: 5.0.0-rc.7

> load ~/Desktop/graph.js
Loaded muster instance.
> ref('firstName')
value({value: "Jane"})
> ref('lastName')
value({value: "Doe"})
```
