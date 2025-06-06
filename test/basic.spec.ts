import { describe, expect, it } from 'vitest'

import { codeToLaTeX } from 'shiki-tex'
import { expectCompile } from './util';

describe('basic test', () => {
  it('should run', async () => {
    const code = `console.log("Hello, world!");`;

    const [content, colorDefs] = await codeToLaTeX(code, {
      lang: 'js',
      theme: 'github-light',
      escapeInside: ['<@', '@>'],
    })

    const expected = `
\\lstset{
  escapeinside={<@}{@>},
  columns=fullflexible,
  basicstyle=\\footnotesize\\ttfamily\\color{24292E},
}
\\begin{lstlisting}
console.<@\\textcolor{6F42C1}{log}@>(<@\\textcolor{032F62}{"Hello,\\texttt{ }world!"}@>);
\\end{lstlisting}
`.trim()
    expect(content).toBe(expected)
    await expectCompile(content, colorDefs)
  })
})

