import { codeToHast } from 'shiki';
import { ASTWalker, HtmlAST } from './adapter';
import fs from 'node:fs/promises'
import { parse } from 'node:path'
import cac from 'cac';


const escapeList = new Map<string, string>([
  ['\\', '\\\\'],
  ['$', '\\$'],
  ['&', '\\&'],
  ['#', '\\#'],
  ['%', '\\%'],
  ['_', '\\_'],
  ['{', '\\{'],
  ['}', '\\}'],
  ['~', '\\~'],
  ['^', '\\^'],
  [' ', '\\texttt{ }'],
  ['\n', '\\\\'],
  ['\t', '\\texttt{\\t}'],
]);

const colorCache = new Map<string, string>();

const escape = (str: string) => {
  let result = str;
  for (const [char, escapedChar] of escapeList.entries()) {
    result = result.replace(new RegExp(`\\${char}`, 'g'), `${escapedChar}`);
  }
  return result;
}

const getTrimmed = (str: string) => {
  let start = 0;
  let end = str.length - 1;
  let chars = [' ', '\t', '\n'];

  while (start <= end && chars.includes(str[start])) {
    start++;
  }

  while (end >= start && chars.includes(str[end])) {
    end--;
  }
  
  return [
    str.slice(start, end + 1),
    str.slice(0, start),
    str.slice(end + 1)
  ]
}

const defineColor = (color: string) => {
  const R = parseInt(color.slice(0, 2), 16);
  const G = parseInt(color.slice(2, 4), 16);
  const B = parseInt(color.slice(4, 6), 16);
  const r = Math.round(R / 255 * 100) / 100;
  const g = Math.round(G / 255 * 100) / 100;
  const b = Math.round(B / 255 * 100) / 100;
  const colorDef = `\\definecolor{${color}}{rgb}{${r}, ${g}, ${b}}`;
  return colorDef;
}

const generateLatexFromAst = async (ext: string, ast: HtmlAST) => {
  const walker = new ASTWalker<HtmlAST>();
  walker.setONodeTypeGuard(
    (node): node is HtmlAST => 'type' in (node as object) && (node as HtmlAST).type !== undefined
  );

  walker.setEnter((o, context) => {
    let result_latex = context.get('result_latex') || '';
    let prepared_buffer = context.get('prepared_buffer') || '';
    if (o.node.type === 'element' && o.node.tagName === 'code') {
      result_latex += `\\begin{lstlisting}[language=${ext}]\n`;
    }
    if (o.node.type === 'text') {
      if (o.parent?.node.type === 'element' && o.parent.node.tagName === 'span') {
        prepared_buffer = o.node.value;
      } else {
        result_latex += o.node.value;
      }
    }
    context.set('result_latex', result_latex);
    context.set('prepared_buffer', prepared_buffer);
  });

  walker.setLeave((o, context) => {
    let result_latex = context.get('result_latex') || '';
    let prepared_buffer = context.get('prepared_buffer') || '';
    if (o.node.type === 'element' && o.node.tagName === 'code') {
      result_latex += '\n\\end{lstlisting}\n';
    }
    if (o.node.type === 'element' && o.node.tagName === 'span') {
      if (o.node.properties.style) {
        const style = o.node.properties.style as string;
        const color = /color:#([a-fA-F0-9]{6})/.exec(style);
        if (color) {
          let [trimmed, before, after] = getTrimmed(prepared_buffer);
          result_latex += before;
          if (color[1] in colorCache) {
            result_latex += `<@\\textcolor{${color[1]}}{${escape(trimmed)}}@>`;
          } else if (color[1] === '000000') {
            result_latex += trimmed;
          } else {
            const colorDef = defineColor(color[1]);
            colorCache.set(color[1], colorDef);
            result_latex += `<@\\textcolor{${color[1]}}{${escape(trimmed)}}@>`;
          }

          result_latex += after;
        }
      }
    }
    context.set('result_latex', result_latex);
    context.set('prepared_buffer', prepared_buffer);
  });

  const context = await walker.walk(ast);
  return context.get('result_latex') || '';
}

export const run = async (
  argv = process.argv,
  output = console.log,
) => {
  const cli = cac('shiki-tex');
  
  cli
    .option('--theme <theme>', 'Color theme to use', { default: 'light-plus' })
    .option('--lang <lang>', 'Programming language')
    .help();
  
  const { options, args } = cli.parse(argv);
  const files = args;
  
  const codes = await Promise.all(files.map(async (path) => {
    const content = await fs.readFile(path, 'utf-8');
    const ext = options.lang || parse(path).ext.slice(1);
    const ast = await codeToHast(content, {
      lang: ext,
      theme: options.theme,
    });

    return await generateLatexFromAst(ext, ast);
  }));
  
  for (const [_, colorDef] of colorCache.entries()) {
    output(colorDef);
  }
  output();
  for (const code of codes) {
    output(code);
  }
}

run();
