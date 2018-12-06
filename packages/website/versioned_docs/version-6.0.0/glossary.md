---
id: version-6.0.0-glossary
title: Glossary
original_id: glossary
---

Find descriptions of Muster terminology below.

## Asynchronous Data

<span class="scope-tag">JavaScript</span> Data that is requested and received when it is ready to supply, as opposed to synchronous or sequential data. Does not block app I/O or responsiveness.



## Branch

<span class="scope-tag">Muster</span> An element in the graph, may contain child branches. See Node.



## Callable Node

<span class="scope-tag">Muster</span> A graph node which contains functional operations that can be called (with or without args) to perform its function.



## Component

<span class="scope-tag">React</span> A UI Component



## Container

<span class="scope-tag">React</span> A connector between Muster and a UI component. Defines the data requirements for that component



## Declarative

<span class="scope-tag">Programming</span> A style of programming where the code describes what you want to do, not necessarily how you want to do it.



## Dependency

<span class="scope-tag">Muster</span> Links between graph nodes.



## Explicit

<span class="scope-tag">Muster</span> The full definition of the use of graph nodes e.g. `array([1,2,3]) -> array([value(1),value(2),value(3)]) `



## Falsy

<span class="scope-tag">JavaScript</span> In JavaScript, a falsy value is a value that is considered false when encountered in a Boolean context. (i.e., `false`, `0`, `""`, `null`, `undefined`, and `NaN`) [def from mdn]



## Graph

<span class="scope-tag">Muster</span> A collection of arbitrary, abstract objects called 'nodes' or 'vertices' that represent points of connection. Nodes are then connected via 'paths' or 'edges', and are used within Muster to store information.



## Implicit

<span class="scope-tag">Muster</span> The shorthand definition of the use of graph nodes. Opposite to explicit



## Node

<span class="scope-tag">Muster</span> Short for 'Graph node'. Used to store, act on or reference data directly and indirectly in the graph.



## Operations Edges

<span class="scope-tag">Muster</span> Actions performed by a node, usually a way of interacting between nodes in the graph.



## Properties Props

<span class="scope-tag">React</span> Props are used in React to pass data to a component by a parent component.



## Provider

<span class="scope-tag">Muster React</span> A component which takes in a mandatory property (the Muster graph) which it then provides to each child connected component.



## Reactive

<span class="scope-tag">Web-Development</span> An approach to application state management that focuses on re-rendering visual components only when their underlying data changes.



## Resolution Chain

<span class="scope-tag">Muster</span> A process of node resolution that gets from the definition of the node to the output (aka static node)



## Settable Node

<span class="scope-tag">Muster</span> A graph node which contains mutable data which can be modified by a setter.



## Static Node

<span class="scope-tag">Muster</span> A graph node which contains immutable data.



## Subscription

<span class="scope-tag">Muster</span> The act of resolving a node, either directly or indirectly, in order to get its result.



## Synchronous Data

<span class="scope-tag">JavaScript</span> Data that is received immediately after it is requested, blocking app I/O until it is resolved.



## Tree

<span class="scope-tag">Muster</span> Muster graphs are declared as trees as this is easier in Javascript. Trees become graphs when the nodes connect to one another.



## Truthy

<span class="scope-tag">JavaScript</span> In JavaScript, a truthy value is a value that is considered true when encountered in a Boolean context. All values are truthy unless they are defined as falsy (i.e., except for `false`, `0`, `""`, `null`, `undefined`, and `NaN`) [def from mdn]



## Virtual Graph

<span class="scope-tag">Muster</span> A set of definitions representing a potential set of node that don’t exist in memory until they’re invoked, such as the set of every potential set of geographic coordinates, or every possible user ID. Entities are only resolved when specific data is requested.

