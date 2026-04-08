# highlightjs-circom

[![npm version](https://img.shields.io/npm/v/highlightjs-circom.svg)](https://www.npmjs.com/package/highlightjs-circom)
[![CI](https://github.com/abdk-consulting/highlightjs-circom/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/abdk-consulting/highlightjs-circom/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A [Highlight.js](https://highlightjs.org/) language plugin that adds rich
syntax highlighting for **[Circom](https://docs.circom.io/)** — the
domain-specific language used to write zero-knowledge arithmetic circuits
(R1CS / SNARKs).

---

## Features

- Full keyword coverage: `template`, `component`, `signal`, `input`, `output`,
  `bus`, `parallel`, `custom`, `extern_c`, `pragma`, `include`, and all
  control-flow keywords
- Circom-specific constraint operators highlighted at high relevance:
  `<==`, `==>`, `<--`, `-->`, `===`
- Pragma directives (`pragma circom 2.x.x`, `pragma custom_templates`)
- Include paths highlighted as strings
- Tag annotations on signals and buses (`{binary}`, `{edwards_point}`, …)
- Built-in functions: `log`, `assert`
- Decimal and hexadecimal numeric literals
- Line and block comments
- Template, function, and bus names highlighted as `title.function`
- Correct auto-detection: Circom code reliably detected via `highlightAuto`

---

## Installation

```bash
npm install highlightjs-circom
```

> `highlight.js` ≥ 11 is a peer dependency — install it separately if you
> haven't already:
>
> ```bash
> npm install highlight.js
> ```

---

## Usage

### CommonJS / Node.js

```js
const hljs = require("highlight.js");
const circom = require("highlightjs-circom");

hljs.registerLanguage("circom", circom.default ?? circom);

const code = `
pragma circom 2.1.5;

template Multiplier(n) {
    signal input a;
    signal input b;
    signal output c;
    c <== a * b;
}
`.trim();

const html = hljs.highlight(code, { language: "circom" }).value;
console.log(html);
```

### ES Modules

```js
import hljs from "highlight.js";
import circom from "highlightjs-circom";

hljs.registerLanguage("circom", circom);

const result = hljs.highlight(code, { language: "circom" });
```

### Browser (CDN)

Load Highlight.js first, then load this plugin:

```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/styles/github-dark.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/highlight.min.js"></script>
<!-- highlightjs-circom -->
<script src="https://unpkg.com/highlightjs-circom/dist/index.js"></script>
<script>
  hljs.registerLanguage("circom", window.hljsCircom?.default ?? window.hljsCircom);
  hljs.highlightAll();
</script>
```

Then mark up your code blocks:

```html
<pre><code class="language-circom">
pragma circom 2.1.5;

template IsZero() {
    signal input in;
    signal output out;
    signal inv;
    inv <-- in != 0 ? 1/in : 0;
    out <== -in * inv + 1;
    in * out === 0;
}

component main = IsZero();
</code></pre>
```

### Auto-detection

The plugin registers Circom with high relevance scores on constraint operators
so `highlightAuto` correctly identifies Circom source files:

```js
const result = hljs.highlightAuto(unknownCode);
console.log(result.language); // "circom"
```

---

## Supported syntax elements

| Element | Highlight class |
|---------|----------------|
| `pragma`, `include` | `hljs-meta` |
| Keywords (`template`, `signal`, `component`, …) | `hljs-keyword` |
| Constraint operators (`<==`, `==>`, `===`, …) | `hljs-operator` |
| Tag annotations `{…}` | `hljs-type` |
| Template / function / bus names | `hljs-title function_` |
| Built-ins (`log`, `assert`) | `hljs-built_in` |
| Literals (`true`, `false`) | `hljs-literal` |
| Numeric literals | `hljs-number` |
| String literals | `hljs-string` |
| Comments | `hljs-comment` |

---

## Example

```circom
pragma circom 2.1.5;
pragma custom_templates;

include "bitify.circom";

/*
 * Computes the bitwise AND of two n-bit numbers.
 */
template BitwiseAnd(n) {
    signal {binary} input a[n];
    signal {binary} input b[n];
    signal {binary} output out[n];

    for (var i = 0; i < n; i++) {
        out[i] <== a[i] * b[i];
    }
}

component main {public [a, b]} = BitwiseAnd(8);
```

---

## Compatibility

| highlight.js | highlightjs-circom |
|--------------|--------------------|
| ≥ 11.0.0 | ✓ |

---

## License

[MIT](LICENSE) © ABDK Consulting
