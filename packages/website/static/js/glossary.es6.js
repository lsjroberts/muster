/*
 * Based on glossarizer https://github.com/PebbleRoad/glossarizer
 */

const defaultOptions = {
  replaceTag: 'abbr' /* Matching words will be wrapped with abbr tags by default */,
  lookupTagName:
    'p, li, em' /* Lookup in either paragraphs or lists. Do not replace in headings ('p, ul, a, div') */,
  callback: null /* Callback once all tags are replaced: Call or tooltip or anything you like */,
  replaceOnce: true /* Replace only once in a TextNode */,
  replaceClass: 'glossary_replaced',
  caseSensitive: false,
  exactMatch: false,
};

function getTerms(glossary) {
  return glossary.reduce(
    (acc, entry) => {
      const terms = entry.term.split(',');
      terms.forEach((term) => {
        const trimmed = term.replace(/^\s+|\s+$/g, '');
        const isExclusion = trimmed.charAt(0) === '!';
        if (isExclusion) {
          acc.excludes.push(trimmed.substr(1));
        } else {
          acc.terms.push(trimmed);
        }
      });
      return acc;
    },
    { terms: [], excludes: [] },
  );
}

function applyTerms(targetEl, glossary, options = {}) {
  const config = {
    el: targetEl,
    options: Object.assign({}, defaultOptions, options),
    replaced: [],
    regexOption:
      (defaultOptions.caseSensitive ? '' : 'i') + (defaultOptions.replaceOnce ? '' : 'g'),
    glossary,
  };

  wrapTerms({
    ...config,
    ...getTerms(glossary),
  });

  if (config.options.callback) {
    config.options.callback.apply(null, [config.el]);
  }
}

function wrapTerms(config) {
  config.cleanedTerms = clean(config.terms.join('|'));
  config.excludedTerms = clean(config.excludes.join('|'));

  const nodes = config.el.querySelectorAll(config.options.lookupTagName);

  nodes.forEach((node) => {
    traverser(config, node);
  });
}

/**
 * Traverses through nodes to find the matching terms in TEXTNODES
 */
function traverser(config, node) {
  const termsRegex = new RegExp(
    '(?:^|\\b)(' + config.cleanedTerms + ')(?!\\w)',
    config.regexOption,
  );
  const exclusionsRegex = new RegExp(
    '(?:^|\\b)(' + config.excludedTerms + ')(?!\\w)',
    config.regexOption,
  );

  let next;

  if (node.nodeType === 1) {
    // Element Node
    if ((node = node.firstChild)) {
      do {
        // Recursively call traverseChildNodes
        // on each child node
        next = node.nextSibling;
        // Check if the node is not glossarized
        if (node.className !== config.options.replaceClass) {
          traverser(config, node);
        }
      } while ((node = next));
    }
  } else if (node.nodeType === 3) {
    // Text Node
    const tempNode = document.createElement('div');
    let data = node.data;

    if (termsRegex.test(data)) {
      const exclusions = exclusionsRegex.exec(data);

      data = data.replace(termsRegex, (match, item, offset) => {
        if (config.options.replaceOnce && inArrayIn(match, config.replaced) >= 0) {
          return match;
        }

        config.replaced.push(match);

        const ir = new RegExp('(?:^|\\b)' + clean(match) + '(?!\\w)');
        const result = ir.exec(data);

        if (result) {
          if (exclusions && config.excludes.length) {
            const id = offset;
            const exclusionIndex = exclusions.index;
            const maxExclusion = exclusions.index + exclusions[0].length;

            if (exclusionIndex <= id && id <= maxExclusion) {
              return match;
            }
            return createTag(match);
          }
          return createTag(match);
        }
      });

      /**
       * Only replace when a match is found
       */
      tempNode.innerHTML = data;
      while (tempNode.firstChild) {
        node.parentNode.insertBefore(tempNode.firstChild, node);
      }
      node.parentNode.removeChild(node);
    }
  }

  function createTag(match) {
    const entry = getEntry(config, match);
    if (!entry) return;
    const description = truncate(entry.description.replace(/"/gi, '&quot;'), 300);
    return `<${config.options.replaceTag} class="${
      config.options.replaceClass
    }" title="${description}" data-id="${entry.id}">${match}</${config.options.replaceTag}>`;
  }
}

function getEntry(config, term) {
  const cleanTerm = clean(term);
  /**
   * Matches
   * 1. Starts with \s* (zero or more spaces)
   * 2. Ends with zero or more spaces
   * 3. Ends with comma
   */
  const termRegex = new RegExp('(,|s*)' + cleanTerm + '\\s*|\\,$', 'i');
  for (let i = 0; i < config.glossary.length; i++) {
    if (config.options.exactMatch) {
      if (config.glossary[i].term === cleanTerm) {
        return config.glossary[i];
      }
    } else if (config.glossary[i].term.match(termRegex)) {
      return config.glossary[i];
    }
  }
}

const RE_ESCAPE = new RegExp(
  '(\\' + ['/', '.', '*', '+', '?', '(', ')', '[', ']', '{', '}', '\\'].join('|\\') + ')',
  'g',
);

function clean(text) {
  return text.replace(RE_ESCAPE, '\\$1');
}

function inArrayIn(elem, array, i) {
  if (typeof elem !== 'string') {
    return array.indexOf(elem);
  }

  if (array) {
    const len = array.length;
    i = i ? (i < 0 ? Math.max(0, len + i) : i) : 0;
    elem = elem.toLowerCase();
    for (; i < len; i++) {
      if (i in array && array[i].toLowerCase() === elem) {
        return i;
      }
    }
  }

  return -1;
}

function addTerms(textSelector, terms) {
  document.querySelectorAll(textSelector).forEach((text) => {
    applyTerms(text, terms, {
      callback: applyTooltips,
    });
  });
}

function truncate(string, n) {
  return string.length > n ? string.substr(0, n - 3) + '&hellip;' : string;
}

const kebabRegex = / (?<!^)([A-Z][a-z]|(?<=[a-z])[A-Z])/g;

function kebabCase(string) {
  return string
    .replace(kebabRegex, '-$1')
    .trim()
    .toLowerCase();
}

function applyTooltips(element) {
  element.querySelectorAll(`.${defaultOptions.replaceClass}`).forEach((node) => {
    const termId = node.getAttribute('data-id');
    const description = node.title.replace(/\n/g, '<br>');
    const content = `<div><h3 class="tippy-heading">${termId}</h3><p class="tippy-definition">${description}</p><a class="tippy-link" href="/muster/docs/glossary.html#${kebabCase(
      termId,
    )}">View glossary</a></div>`;
    tippy(node, {
      arrow: true,
      allowHTML: true,
      content,
      performance: true,
      size: 'large',
      theme: 'light',
      interactive: true,
      interactiveBorder: true,
      interactiveDebounce: 30,
    });
  });
}

if (!window.location.pathname.includes('glossary')) {
  fetch('/muster/js/glossary.json')
    .then((response) => response.json())
    .then((glossaryTerms) => {
      window.addEventListener('load', () => {
        addTerms('.post', glossaryTerms.terms);
      });
    });
}
