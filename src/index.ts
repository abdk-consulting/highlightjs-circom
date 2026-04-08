import { HLJSApi, Language } from "highlight.js";

export default function circom(hljs: HLJSApi): Language {
  // Circom-specific constraint and signal-assignment operators.
  // These are the most distinctive tokens of the language and are given
  // high relevance so the language is correctly auto-detected.
  //   <== / ==>  — assign a value AND add an R1CS equality constraint
  //   <-- / -->  — assign a value only (no constraint; use with care)
  //   ===        — add an equality constraint without assignment
  const CONSTRAINT_OPERATORS = {
    className: 'operator',
    begin: /<==|==>|<--|-->|===/,
    relevance: 10
  };

  // Signal / bus tags:  signal {binary} input in;
  //                     signal output out {maxbits};
  //                     input Point() {edwards_point} p;
  //                     component main {public [a]} = ...
  // Tags are always single-line {…} with no nested braces — use match
  // so multi-line blocks (template/function bodies) are never consumed.
  const TAG = {
    className: 'type',
    match: /\{[^{}\n]*\}/,
    relevance: 0
  };

  // pragma circom 2.0.0;
  // pragma custom_templates;
  const PRAGMA = {
    className: 'meta',
    begin: /\bpragma\b/,
    end: /;/,
    contains: [
      // sub-keywords of pragma
      {
        className: 'keyword',
        begin: /\b(?:circom|custom_templates)\b/,
        relevance: 1
      },
      // version number, e.g. 2.0.0
      {
        className: 'number',
        begin: /\d+(?:\.\d+)+/
      }
    ]
  };

  // include "path/to/file.circom";
  const INCLUDE = {
    className: 'meta',
    begin: /\binclude\b/,
    end: /;/,
    contains: [hljs.QUOTE_STRING_MODE]
  };

  return {
    name: 'Circom',
    aliases: ['circom'],
    keywords: {
      keyword:
        // core declaration keywords
        'template component signal input output public private ' +
        'var function return ' +
        // control flow
        'if else for while do ' +
        // directives
        'include pragma ' +
        // Circom 2.x additions
        'bus parallel custom extern_c',
      built_in: 'log assert',
      literal: 'true false'
    },
    contains: [
      // ── comments ──────────────────────────────────────────────────────────
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,

      // ── directives ────────────────────────────────────────────────────────
      PRAGMA,
      INCLUDE,

      // ── string literals (appear in include / log) ─────────────────────────
      hljs.QUOTE_STRING_MODE,

      // ── numeric literals (decimal and 0x… hex) ───────────────────────────
      hljs.C_NUMBER_MODE,

      // ── Circom constraint / signal-assignment operators ───────────────────
      CONSTRAINT_OPERATORS,

      // ── standard operators ────────────────────────────────────────────────
      // Ordered so multi-char tokens match before their single-char prefixes.
      //   **=  >>=  <<=  &&  ||  ++  --  \=  ==  =  and all compound-assignment
      //   forms, followed by single-char arithmetic / bitwise / relational
      //   operators, plus the ternary ? :
      // Note: ===, <==, ==>, <--, --> are caught earlier by CONSTRAINT_OPERATORS
      // (higher relevance, earlier in contains), so they never reach this rule.
      {
        className: 'operator',
        begin: /\*\*=?|>>=?|<<=?|&&|\|\||\+\+|--|\\=?|==?|[+\-*/%&|^~!]=?|[<>]=?|[?:]/,
        relevance: 0
      },

      // ── tag annotations { … } ─────────────────────────────────────────────
      TAG,

      // ── template definition ───────────────────────────────────────────────
      // template [parallel] [custom] [extern_c] TemplateName(…)
      {
        begin: /\btemplate\b/,
        className: 'keyword',
        starts: {
          // scan until the opening parenthesis is seen (without consuming it)
          end: /(?=\()/,
          keywords: { keyword: 'parallel custom extern_c' },
          contains: [
            { className: 'title.function', begin: /[A-Za-z_]\w*/, relevance: 0 }
          ]
        }
      },

      // ── function definition ───────────────────────────────────────────────
      {
        begin: /\bfunction\b/,
        className: 'keyword',
        starts: {
          end: /(?=\()/,
          contains: [
            { className: 'title.function', begin: /[A-Za-z_]\w*/, relevance: 0 }
          ]
        }
      },

      // ── bus definition ────────────────────────────────────────────────────
      {
        begin: /\bbus\b/,
        className: 'keyword',
        starts: {
          end: /(?=\()/,
          contains: [
            { className: 'title.function', begin: /[A-Za-z_]\w*/, relevance: 0 }
          ]
        }
      }
    ]
  };
}
