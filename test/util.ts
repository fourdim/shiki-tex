import { describe, expect, it } from 'vitest'
import { exec, execSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import process from 'node:process';
import path from 'node:path';

function template(strings, ...keys) {
  return (...values) => {
    const dict = values[values.length - 1] || {};
    const result = [strings[0]];
    keys.forEach((key, i) => {
      const value = Number.isInteger(key) ? values[key] : dict[key];
      result.push(value, strings[i + 1]);
    });
    return result.join("");
  };
}

const laTeXTemplate = template`
\\documentclass{article}
\\usepackage{listings}
\\usepackage{xcolor}

${"colorDefs"}

\\lstset{
  escapeinside={<@}{@>}
}

\\begin{document}

${"content"}

\\end{document}
`

export const mkTempFolder = () => {
  return mkdtempSync(path.join(os.tmpdir(), "shiki-text-"));
}


export const compileLaTeX = async (laTeX: string) => {
  try {
    execSync('pdflatex --version', { stdio: 'ignore' });
  } catch (error) {
    throw new Error('pdflatex is not installed. Please install it to compile LaTeX.');
  }

  return new Promise((resolve, reject) => {
    const laTeXFile = 'temp.tex';

    const tempDir = mkTempFolder();
    const oldDir = process.cwd();

    process.chdir(tempDir);

    writeFileSync(laTeXFile, laTeX);

    exec(`pdflatex -halt-on-error ${laTeXFile}`, (error, stdout) => {
      if (error) {
        console.error(error);
        if (stdout) {
          console.error(`${stdout}`);
        }
        console.error(`CWD: ${process.cwd()}`);
        reject("Error compiling LaTeX");
      } else {
        rmSync(tempDir, { recursive: true, force: true });
        resolve(0);
      }
      process.chdir(oldDir);
    });
  });
}

export const expectCompile = async (
  content: string,
  colorDefs: Map<string, string>,
) => {
  await compileLaTeX(
    laTeXTemplate({
      colorDefs: Array.from(colorDefs.values()).join('\n'),
      content,
    }),
  )
}
