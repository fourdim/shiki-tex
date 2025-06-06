import { describe, expect, it } from 'vitest'

import { codeToLaTeX } from 'shiki-tex'
import { expectCompile } from './util';
describe('escape test', () => {
  it('backslash', async () => {
    const code = `const a = "\\\\n"`;

    const [content, colorDefs] = await codeToLaTeX(code, {
      lang: 'js',
      theme: 'github-light',
      escapeInside: ['<@', '@>'],
    })

    const expected = `
\\lstset{
  basicstyle=\\footnotesize\\ttfamily\\color{24292E},
}
\\begin{lstlisting}
<@\\textcolor{D73A49}{const}@> <@\\textcolor{005CC5}{a}@> <@\\textcolor{D73A49}{=}@> <@\\textcolor{032F62}{"}@><@\\textcolor{005CC5}{\\textbackslash \\textbackslash }@><@\\textcolor{032F62}{n"}@>
\\end{lstlisting}
`.trim();
    expect(content).toBe(expected)
    await expectCompile(content, colorDefs)
  })

  it('$sign', async () => {
    const code = `const a = \`\${aa}\``;

    const [content, colorDefs] = await codeToLaTeX(code, {
      lang: 'js',
      theme: 'github-light',
      escapeInside: ['<@', '@>'],
    })

    const expected = `
\\lstset{
  basicstyle=\\footnotesize\\ttfamily\\color{24292E},
}
\\begin{lstlisting}
<@\\textcolor{D73A49}{const}@> <@\\textcolor{005CC5}{a}@> <@\\textcolor{D73A49}{=}@> <@\\textcolor{032F62}{\`\\$\\{}@>aa<@\\textcolor{032F62}{\\}\`}@>
\\end{lstlisting}
`.trim();
    expect(content).toBe(expected)
    await expectCompile(content, colorDefs)
  })
})