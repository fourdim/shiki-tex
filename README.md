# shiki-tex

A beautiful syntax highlighter for LaTeX code listing based on [Shiki](https://github.com/shikijs/shiki).

[🚀 Playground](https://shiki-tex.vercel.app/)

## Get Started

The [Playground](https://shiki-tex.vercel.app/) offers the simplest way to generate LaTeX code listings:

1. Paste your code into the editor
2. Select your preferred language and theme
3. Copy the generated LaTeX code
4. Paste it into your LaTeX document

The syntax highlighting will be automatically applied when you compile your LaTeX document.

## Installation

You can also install `shiki-tex` via npm and use it programmatically in your projects:

```bash
npm install shiki-tex
```


## Core API

```ts
import { codeToLaTeX } from 'shiki-tex';

const code = `console.log("Hello, world!");`;

const [content, colorDefs] = await codeToLaTeX(code, {
  lang: 'js',
  theme: 'light-plus',
  escapeInside: ['<@', '@>'],
});

console.log(Array.from(colorDef.values()).join('\n'));
console.log(content);
```

## License

[MPL 2.0](./LICENSE)
