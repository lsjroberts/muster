---
id: version-6.0.0-introduction
title: Introduction
original_id: introduction
---

Muster is a reactive state and data management library. It can:
- Collect data from multiple sources (user input, files, APIs, databases, etc.)
- Process the data in a reactive way, meaning that when the source (e.g. a file) changes, your logic that depends on that file gets re-run
- Manage dependencies between different pieces of logic
- Expose the data and logic as a graph
- Transparently handle synchronous and asynchronous data

![Muster Intro](assets/muster-intro.png)

Every Muster application expresses its data as a set of graph **nodes**, which can create links (dependencies) between each other. Muster introduces a concept of typed nodes, and different types of edges (called **operations**) between these nodes.

Muster operates a **virtual** graph, in the sense that Muster allows the creation of **matchers** which don’t exist in memory until they’re invoked – so the potential, virtual nodes are there but the actual entities haven’t yet been retrieved.

The following pages will take you through how Muster works and how to use it. Elsewhere, don't miss the **Resources** section for other pages that may be of interest:

- [Setting up Muster](/muster/docs/resources/setup.html)
- [Frequently Asked Questions](/muster/docs/resources/faq)
- [Essential nodes](/muster/docs/resources/essential-nodes)
- [Glossary of common terms](/muster/docs/glossary)
- [Latest changes](/muster/docs/changelog)
- [Common Muster Errors](/muster/docs/resources/common-muster-errors)

In addition, the library offers extensive reference [API documentation](/muster/api/latest). 
