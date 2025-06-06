import { codeToLaTeX } from 'shiki-tex';
import fs from 'node:fs/promises';
import { parse } from 'node:path';
import cac from 'cac';

export type EscapeInsidePair = [string, string];

export const run = async (
  argv = process.argv,
  output = console.log,
) => {
  const cli = cac('shiki-tex');

  cli
    .option('--wrap-if <condition>', 'Wrap the output and the original code in an if clause')
    .option('--theme <theme>', 'Color theme to use', { default: 'light-plus' })
    .option('--lang <lang>', 'Programming language')
    .option('--escape-inside <left,right>', 'Escape characters inside the code, seperate by comma', { default: '<@,@>' });

  cli.help();

  const { options, args } = cli.parse(argv);
  const files = args;

  const colorStore = new Map<string, string>();

  const result = await Promise.all(files.map(async (path) => {
    const code = await fs.readFile(path, 'utf-8');
    const ext = options.lang || parse(path).ext.slice(1);

    return await codeToLaTeX(code, {
      lang: ext,
      theme: options.theme,
      escapeInside: options.escapeInside.split(',') as EscapeInsidePair,
    }).then(([LaTeX, colorCache]) => {
      for (const [color, colorDef] of colorCache.entries()) {
        if (!colorStore.has(color)) {
          colorStore.set(color, colorDef);
        }
      }
      return [code, LaTeX];
    })
  }));

  if (options.wrapIf) {
    output(`\\def\\${options.wrapIf}{1}`);
  }

  for (const [_, colorDef] of colorStore.entries()) {
    output(colorDef);
  }
  output();
  for (const [code, LaTeX] of result) {
    if (options.wrapIf) {
      output(`\\if\\${options.wrapIf}1`);
      output(LaTeX);
      output('\\else\n\\begin{lstlisting}');
      output(code);
      output('\\end{lstlisting}\n\\fi');
    } else {
      output(LaTeX);
    }
  }
}

run();
