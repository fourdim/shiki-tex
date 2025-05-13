import { describe, expect, it } from 'vitest'

import { codeToLaTeX } from '../src/index'
import { expectCompile } from './util';

describe('basic test', () => {
  it('should run', async () => {
    const code = `console.log("Hello, world!");`;

    const [content, colorDefs] = await codeToLaTeX(code, {
      lang: 'js',
      theme: 'github-light',
    })

    const expected = `
\\lstset{
  basicstyle=\\footnotesize\\ttfamily\\color{24292E},
}
\\begin{lstlisting}
console.<@\\textcolor{6F42C1}{log}@>(<@\\textcolor{032F62}{"Hello,\\texttt{ }world!"}@>);
\\end{lstlisting}
`.trimStart()
    expect(content).toBe(expected)
    await expectCompile(content, colorDefs)
  })
})

