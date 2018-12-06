export type HashSet = Set<string>;

export function createHashSet(): HashSet {
  return new Set([]);
}

export function hashSetContains(key: string, set: HashSet): boolean {
  return set.has(key);
}

export function addHashSetItem(key: string, set: HashSet): HashSet {
  return new Set(set).add(key);
}

export function removeHashSetItem(key: string, set: HashSet): HashSet {
  const clone = new Set(set);
  clone.delete(key);
  return clone;
}

export function mergeHashSets(set1: Set<string>, set2: Set<string>): Set<string> {
  return new Set([...set1, ...set2]);
}
