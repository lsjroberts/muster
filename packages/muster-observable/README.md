# Muster Observable

A simple TC39-compliant stream library with a functional API

Usage example:

```js
import { Observable, map, filter } from '@dws/muster-observable';

const inputStream = Observable.from(['foo', 'bar', 'baz', 'qux']);
const filteredStream = filter((value) => value.startsWith('b'), inputStream);
const uppercaseStream = map((value) => value.toUpperCase(), filteredStream);

const subscription = uppercaseStream.subscribe(console.log); // Logs "BAR" and "BAZ"

subscription.unsubscribe();
```
