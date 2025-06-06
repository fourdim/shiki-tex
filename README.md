# shiki-tex

A beautiful syntax highlighter for LaTeX code listing based on [Shiki](https://github.com/shikijs/shiki).

[🚀 Playground](https://shiki-tex.vercel.app/)

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
