/**
 * Comprehensive test suite for highlightjs-circom.
 *
 * Uses Node.js built-in test runner (node:test) and assert — no extra
 * dependencies needed beyond highlight.js itself.
 *
 * Run:  npm test
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import hljs from "highlight.js";
import circom from "../index.js";

// Register the language once for all tests.
hljs.registerLanguage("circom", circom);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Decode the five standard HTML entities so that assertions can be written
 * against the original source characters instead of their escaped forms.
 */
function decodeEntities(html: string): string {
  return html
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * Highlight `code` with the given `language` and return the decoded HTML.
 */
function highlight(code: string, language: string): string {
  return decodeEntities(hljs.highlight(code, { language }).value);
}

/**
 * Auto-detect the language for `code` and return the detected language name.
 */
function detect(code: string): string {
  const result = hljs.highlightAuto(code);
  return result.language ?? "";
}

/**
 * Assert that `html` contains a span with the given CSS class that either:
 *  (a) directly wraps `text` as its ONLY content, OR
 *  (b) begins with the class and contains `text` as literal (unspanned) text
 *      directly inside it (the PRAGMA / INCLUDE case where hljs wraps the
 *      entire directive in one outer meta-span).
 */
function assertSpan(html: string, cls: string, text: string): void {
  const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Case (a): span wraps text directly — no child spans around it
  const directRe = new RegExp(`<span class="${cls}"[^>]*>${escaped}<\\/span>`);
  // Case (b): outer span contains text as raw (untagged) content somewhere inside
  const outerRe = new RegExp(
    `<span class="${cls}"[^>]*>[^<]*(?:<span[^>]*>[^<]*<\\/span>[^<]*)*${escaped}`
  );
  assert.ok(
    directRe.test(html) || outerRe.test(html),
    `Expected span.${cls} containing "${text}"\nActual HTML:\n${html}`
  );
}

// ---------------------------------------------------------------------------
// 1. Pragma directive
// ---------------------------------------------------------------------------

describe("pragma directive", () => {
  it("highlights `pragma` as meta", () => {
    const html = highlight("pragma circom 2.1.5;", "circom");
    assertSpan(html, "hljs-meta", "pragma");
  });

  it("highlights `circom` version sub-keyword inside pragma", () => {
    const html = highlight("pragma circom 2.1.5;", "circom");
    assertSpan(html, "hljs-keyword", "circom");
  });

  it("highlights version number inside pragma", () => {
    const html = highlight("pragma circom 2.1.5;", "circom");
    assertSpan(html, "hljs-number", "2.1.5");
  });

  it("highlights `custom_templates` pragma", () => {
    const html = highlight("pragma custom_templates;", "circom");
    assertSpan(html, "hljs-keyword", "custom_templates");
  });
});

// ---------------------------------------------------------------------------
// 2. Include directive
// ---------------------------------------------------------------------------

describe("include directive", () => {
  it("highlights `include` as meta", () => {
    const html = highlight('include "circuits/stdlib.circom";', "circom");
    assertSpan(html, "hljs-meta", "include");
  });

  it("highlights the included path as a string", () => {
    const html = highlight('include "circuits/stdlib.circom";', "circom");
    assertSpan(html, "hljs-string", '"circuits/stdlib.circom"');
  });
});

// ---------------------------------------------------------------------------
// 3. Comments
// ---------------------------------------------------------------------------

describe("comments", () => {
  it("highlights single-line comment", () => {
    const html = highlight("// this is a comment", "circom");
    assertSpan(html, "hljs-comment", "// this is a comment");
  });

  it("highlights block comment", () => {
    const html = highlight("/* block */", "circom");
    assertSpan(html, "hljs-comment", "/* block */");
  });

  it("highlights multi-line block comment", () => {
    const html = highlight("/* line1\n   line2 */", "circom");
    assert.match(
      html,
      /class="hljs-comment"/,
      "Block comment should be highlighted"
    );
  });
});

// ---------------------------------------------------------------------------
// 4. Keywords
// ---------------------------------------------------------------------------

describe("keywords", () => {
  const kws = [
    "template", "component", "signal", "input", "output",
    "public", "private", "var", "function", "return",
    "if", "else", "for", "while", "do",
    "bus", "parallel", "custom", "extern_c",
  ];

  for (const kw of kws) {
    it(`highlights keyword \`${kw}\``, () => {
      // Wrap in a minimal valid context so the parser sees it clearly.
      const html = highlight(`${kw} `, "circom");
      assertSpan(html, "hljs-keyword", kw);
    });
  }
});

// ---------------------------------------------------------------------------
// 5. Built-ins
// ---------------------------------------------------------------------------

describe("built-ins", () => {
  it("highlights `log`", () => {
    const html = highlight("log(x);", "circom");
    assertSpan(html, "hljs-built_in", "log");
  });

  it("highlights `assert`", () => {
    const html = highlight("assert(n > 0);", "circom");
    assertSpan(html, "hljs-built_in", "assert");
  });
});

// ---------------------------------------------------------------------------
// 6. Literals
// ---------------------------------------------------------------------------

describe("literals", () => {
  it("highlights `true`", () => {
    const html = highlight("true", "circom");
    assertSpan(html, "hljs-literal", "true");
  });

  it("highlights `false`", () => {
    const html = highlight("false", "circom");
    assertSpan(html, "hljs-literal", "false");
  });
});

// ---------------------------------------------------------------------------
// 7. Numeric literals
// ---------------------------------------------------------------------------

describe("numeric literals", () => {
  it("highlights decimal integer", () => {
    const html = highlight("254", "circom");
    assertSpan(html, "hljs-number", "254");
  });

  it("highlights hex literal", () => {
    const html = highlight("0xdeadbeef", "circom");
    assertSpan(html, "hljs-number", "0xdeadbeef");
  });
});

// ---------------------------------------------------------------------------
// 8. Constraint / signal-assignment operators
// ---------------------------------------------------------------------------

describe("constraint operators", () => {
  const ops: [string, string][] = [
    ["<==", "left constraint-assign"],
    ["==>", "right constraint-assign"],
    ["<--", "left signal-assign"],
    ["-->", "right signal-assign"],
    ["===", "equality constraint"],
  ];

  for (const [op, label] of ops) {
    it(`highlights ${label} operator \`${op}\``, () => {
      const html = highlight(`a ${op} b`, "circom");
      assertSpan(html, "hljs-operator", op);
    });
  }
});

// ---------------------------------------------------------------------------
// 9. Standard operators
// ---------------------------------------------------------------------------

describe("standard operators", () => {
  const ops = ["+=", "-=", "*=", "/=", "**", "++", "--", "==", "!=", "&&", "||"];
  for (const op of ops) {
    it(`highlights operator \`${op}\``, () => {
      const html = highlight(`a ${op} b`, "circom");
      assert.match(
        html,
        /class="hljs-operator"/,
        `Operator ${op} should be highlighted`
      );
    });
  }
});

// ---------------------------------------------------------------------------
// 10. Tag annotations { … }
// ---------------------------------------------------------------------------

describe("tag annotations", () => {
  it("highlights {binary} tag on signal", () => {
    const html = highlight("signal {binary} input in;", "circom");
    assertSpan(html, "hljs-type", "{binary}");
  });

  it("highlights {maxbits} tag on signal output", () => {
    const html = highlight("signal output out {maxbits};", "circom");
    assertSpan(html, "hljs-type", "{maxbits}");
  });

  it("highlights multi-word tag {edwards_point}", () => {
    const html = highlight("input Point() {edwards_point} p;", "circom");
    assertSpan(html, "hljs-type", "{edwards_point}");
  });

  it("highlights {public [a]} component tag", () => {
    const html = highlight("component main {public [a]} = Foo();", "circom");
    assertSpan(html, "hljs-type", "{public [a]}");
  });
});

// ---------------------------------------------------------------------------
// 11. Template / function / bus names
// ---------------------------------------------------------------------------

describe("template name highlighting", () => {
  it("highlights template name as title.function", () => {
    const html = highlight("template Multiplier(n) {}", "circom");
    assertSpan(html, "hljs-title function_", "Multiplier");
  });

  it("highlights parallel template", () => {
    const html = highlight("template parallel FastFFT(n) {}", "circom");
    assertSpan(html, "hljs-title function_", "FastFFT");
  });

  it("highlights function name as title.function", () => {
    const html = highlight("function nbits(n) {}", "circom");
    assertSpan(html, "hljs-title function_", "nbits");
  });

  it("highlights bus name as title.function", () => {
    const html = highlight("bus Point(n) {}", "circom");
    assertSpan(html, "hljs-title function_", "Point");
  });
});

// ---------------------------------------------------------------------------
// 12. Full template snippet
// ---------------------------------------------------------------------------

describe("full template snippet", () => {
  const snippet = `
pragma circom 2.1.5;

// Standard Multiplier
template Multiplier(n) {
    signal input a;
    signal input b;
    signal output c;
    c <== a * b;
}

component main = Multiplier(2);
`.trim();

  it("highlights pragma meta", () => {
    assertSpan(highlight(snippet, "circom"), "hljs-meta", "pragma");
  });

  it("highlights template keyword", () => {
    assertSpan(highlight(snippet, "circom"), "hljs-keyword", "template");
  });

  it("highlights template name", () => {
    assertSpan(highlight(snippet, "circom"), "hljs-title function_", "Multiplier");
  });

  it("highlights signal keyword", () => {
    assertSpan(highlight(snippet, "circom"), "hljs-keyword", "signal");
  });

  it("highlights constraint-assign operator", () => {
    assertSpan(highlight(snippet, "circom"), "hljs-operator", "<==");
  });

  it("highlights component keyword", () => {
    assertSpan(highlight(snippet, "circom"), "hljs-keyword", "component");
  });

  it("highlights comment", () => {
    assert.match(
      highlight(snippet, "circom"),
      /class="hljs-comment"/,
      "Inline comment should be highlighted"
    );
  });
});

// ---------------------------------------------------------------------------
// 13. Real-world Pedersen hash circuit fragment
// ---------------------------------------------------------------------------

describe("real-world Pedersen-like fragment", () => {
  const snippet = `
pragma circom 2.1.5;
pragma custom_templates;

include "bitify.circom";
include "escalarmulfix.circom";

template Pedersen(n) {
    signal input in[n];
    signal {binary} input bits[n];
    signal output {edwards_point} out;

    component bits2num[n];
    var lc = 0;
    for (var i = 0; i < n; i++) {
        bits2num[i] = Bits2Num(253);
        assert(bits[i] <= 1);
        lc += bits[i] * (2 ** i);
    }
    out <== lc;
    log("hash computed", out);
}
`.trim();

  it("compiles without errors", () => {
    assert.doesNotThrow(() => highlight(snippet, "circom"));
  });

  it("highlights custom_templates pragma sub-keyword", () => {
    assertSpan(highlight(snippet, "circom"), "hljs-keyword", "custom_templates");
  });

  it("highlights {binary} tag", () => {
    assertSpan(highlight(snippet, "circom"), "hljs-type", "{binary}");
  });

  it("highlights {edwards_point} tag", () => {
    assertSpan(highlight(snippet, "circom"), "hljs-type", "{edwards_point}");
  });

  it("highlights for/var keywords", () => {
    assertSpan(highlight(snippet, "circom"), "hljs-keyword", "for");
    assertSpan(highlight(snippet, "circom"), "hljs-keyword", "var");
  });

  it("highlights assert built-in", () => {
    assertSpan(highlight(snippet, "circom"), "hljs-built_in", "assert");
  });

  it("highlights log built-in", () => {
    assertSpan(highlight(snippet, "circom"), "hljs-built_in", "log");
  });

  it("highlights constraint-assign", () => {
    assertSpan(highlight(snippet, "circom"), "hljs-operator", "<==");
  });
});

// ---------------------------------------------------------------------------
// 14. Auto-detection: Circom code should be detected as circom
// ---------------------------------------------------------------------------

describe("auto-detection — Circom snippets", () => {
  it("detects a simple template as circom", () => {
    const code = `
pragma circom 2.0.0;
template Add() {
    signal input a;
    signal input b;
    signal output c;
    c <== a + b;
}`.trim();
    assert.equal(detect(code), "circom");
  });

  it("detects constraint-heavy snippet as circom", () => {
    const code = `
signal input x;
signal output y;
y <== x * x;
assert(y > 0);`.trim();
    assert.equal(detect(code), "circom");
  });

  it("detects snippet with === constraint as circom", () => {
    const code = `
signal input a;
signal input b;
a * b === 0;`.trim();
    assert.equal(detect(code), "circom");
  });
});

// ---------------------------------------------------------------------------
// 15. Auto-detection: Non-Circom snippets should NOT be detected as circom
// ---------------------------------------------------------------------------

describe("auto-detection — non-Circom snippets", () => {
  it("does not detect plain JavaScript as circom", () => {
    const code = `
function multiply(a, b) {
  const result = a * b;
  console.log(result);
  return result;
}`.trim();
    assert.notEqual(detect(code), "circom");
  });

  it("does not detect Solidity as circom", () => {
    const code = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleStorage {
    uint256 private value;

    function set(uint256 v) external {
        value = v;
    }

    function get() external view returns (uint256) {
        return value;
    }
}`.trim();
    assert.notEqual(detect(code), "circom");
  });

  it("does not detect plain C as circom", () => {
    const code = `
#include <stdio.h>

int main(void) {
    int a = 1, b = 2;
    printf("%d\\n", a + b);
    return 0;
}`.trim();
    assert.notEqual(detect(code), "circom");
  });

  it("does not detect Rust as circom", () => {
    const code = `
use std::collections::HashMap;

fn main() {
    let mut map: HashMap<&str, i32> = HashMap::new();
    map.insert("hello", 42);
    println!("{:?}", map);
}`.trim();
    assert.notEqual(detect(code), "circom");
  });

  it("does not detect Python as circom", () => {
    const code = `
def fibonacci(n: int) -> int:
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print(fibonacci(10))`.trim();
    assert.notEqual(detect(code), "circom");
  });

  it("does not detect TypeScript as circom", () => {
    const code = `
interface User {
  id: number;
  name: string;
}

function greet(user: User): string {
  return \`Hello, \${user.name}!\`;
}`.trim();
    assert.notEqual(detect(code), "circom");
  });
});
