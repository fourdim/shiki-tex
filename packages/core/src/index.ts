import { BundledLanguage, BundledTheme, codeToHast } from 'shiki';
import { ASTWalker, HtmlAST } from './adapter';

export type EscapeInsidePair = [string, string];

const RealSpacePlaceholder = '||114space514||';

const escapeList = new Map<string, string>([
  ['\\', '\\textbackslash' + RealSpacePlaceholder],
  ['$', '\\$'],
  ['&', '\\&'],
  ['#', '\\#'],
  ['%', '\\%'],
  ['_', '\\_'],
  ['{', '\\{'],
  ['}', '\\}'],
  ['~', '\\textasciitilde' + RealSpacePlaceholder],
  ['^', '\\textasciicircum' + RealSpacePlaceholder],
]);

const escape = (str: string) => {
  let result = '';
  for (const char of str) {
    if (escapeList.has(char)) {
      result += escapeList.get(char);
    } else {
      result += char;
    }
  }
  result = result.replace(/ {1,}/g, (match) => {
    return '\\texttt{' + match + '}';
  });
  return result.replaceAll(RealSpacePlaceholder, ' ');
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
  if (color.length === 3) {
    color = color.split('').map(c => c + c).join('');
  }
  const R = parseInt(color.slice(0, 2), 16);
  const G = parseInt(color.slice(2, 4), 16);
  const B = parseInt(color.slice(4, 6), 16);
  const r = Math.round(R / 255 * 100) / 100;
  const g = Math.round(G / 255 * 100) / 100;
  const b = Math.round(B / 255 * 100) / 100;
  const colorDef = `\\definecolor{${color}}{rgb}{${r}, ${g}, ${b}}`;
  return colorDef;
}

const colorExtract = (str: string) => {
  const colorMatch = /#([a-fA-F0-9]{3,6})/.exec(str);
  if (colorMatch) {
    const color = colorMatch[1];
    if (color.length === 3) {
      return color.split('').map(c => c + c).join('').toUpperCase();
    }
    return color.toUpperCase();
  }
  return null;
}

export const codeToLaTeX = async (
  content: string,
  options: {
    lang: BundledLanguage,
    theme: BundledTheme,
    escapeInside: EscapeInsidePair,
  }
): Promise<[string, Map<string, string>]> => {
  const ast = await codeToHast(content, {
    lang: options.lang,
    theme: options.theme,
  });

  const [escapeLeft, escapeRight] = options.escapeInside;

  const colorCache = new Map<string, string>();

  const walker = new ASTWalker<HtmlAST>();
  walker.setONodeTypeGuard(
    (node): node is HtmlAST => 'type' in (node as object) && (node as HtmlAST).type !== undefined
  );

  walker.setEnter((o, context) => {
    if (o.node.type === 'element' && o.node.tagName === 'pre') {
      if (o.node.properties.style) {
        const style = o.node.properties.style as string;
        const styles = style.split(';');
        const pendingStyleList: string[] = [];
        pendingStyleList.push(`\\lstset{`);
        for (const s of styles) {
          const [key, value] = s.split(':');
          const color = colorExtract(value.trim());
          if (key.trim() === 'background-color' && color && color !== 'FFFFFF') {
            if (!colorCache.has(color)) {
              const colorDef = defineColor(color);
              colorCache.set(color, colorDef);
            }
            pendingStyleList.push(`  backgroundcolor=\\color{${color}},`);
          }
          if (key.trim() === 'color' && color && color !== '000000') {
            if (!colorCache.has(color)) {
              const colorDef = defineColor(color);
              colorCache.set(color, colorDef);
            }
            context.fontColor = color;
            pendingStyleList.push(`  basicstyle=\\footnotesize\\ttfamily\\color{${color}},`);
          }
        }
        pendingStyleList.push("}\n");
        context.resultLaTeX += pendingStyleList.join('\n');
      }
    }
    if (o.node.type === 'element' && o.node.tagName === 'code') {
      context.resultLaTeX += `\\begin{lstlisting}\n`;
    }
    if (o.node.type === 'text') {
      if (o.parent?.node.type === 'element' && o.parent.node.tagName === 'span') {
        context.preparedBuffer = o.node.value;
      } else {
        context.resultLaTeX += o.node.value;
      }
    }
  });

  walker.setLeave((o, context) => {
    if (o.node.type === 'element' && o.node.tagName === 'code') {
      context.resultLaTeX += '\n\\end{lstlisting}';
    }
    if (o.node.type === 'element' && o.node.tagName === 'span') {
      if (o.node.properties.style) {
        const style = o.node.properties.style as string;
        const color = colorExtract(style);
        if (color) {
          let [trimmed, before, after] = getTrimmed(context.preparedBuffer);
          context.resultLaTeX += before;
          if (color in colorCache) {
            context.resultLaTeX += `${escapeLeft}\\textcolor{${color}}{${escape(trimmed)}}${escapeRight}`;
          } if (color === context.fontColor) {
            context.resultLaTeX += trimmed;
          } else {
            const colorDef = defineColor(color);
            colorCache.set(color, colorDef);
            context.resultLaTeX += `${escapeLeft}\\textcolor{${color}}{${escape(trimmed)}}${escapeRight}`;
          }
          context.resultLaTeX += after;
        }
      }
    }
  });

  const context = await walker.walk(ast);
  return [context.resultLaTeX, colorCache];
}
