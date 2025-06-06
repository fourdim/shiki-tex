<script setup lang="ts">
import { ref } from 'vue'
import { codeToLaTeX } from 'shiki-tex'
import { codeToHtml } from 'shiki'


const placeholder = `
#include <stdio.h>
int main() {
    printf("Hello, world!\\n");
    return 0;
}
`.trimStart()
const input = ref(placeholder)
const lang = ref('c')
const theme = ref('light-plus')
const escapeInside = ref('<@,@>')
const output = ref('')
const preview = ref('')
const colorDefs = ref<string[]>([])
const error = ref('')

const runConvert = async () => {
  error.value = ''
  try {
    const [latex, colorCache] = await codeToLaTeX(input.value, {
      lang: lang.value,
      theme: theme.value,
      escapeInside: escapeInside.value.split(',') as [string, string],
    })
    output.value = latex
    preview.value = await codeToHtml(input.value, {
      lang: lang.value,
      theme: theme.value,
    })
    colorDefs.value = Array.from(colorCache.values())
  } catch (e: any) {
    error.value = e?.message || String(e)
    output.value = ''
    preview.value = ''
    colorDefs.value = []
  }
}

runConvert()
</script>

<template>
  <div class="playground">
    <nav>
      <h1>shiki-tex Playground</h1>
      <a class="icon-box" href="https://github.com/fourdim/shiki-tex" target="_blank">
        <div class="i-mdi-github"></div>
      </a>
    </nav>
    <div class="boxes">
      <div class="input-box">
        <h2>Controls</h2>
        <div class="controls">
          <label>
            Language:
            <input class="control-input" v-model="lang" placeholder="c, js, py, ..." @change="runConvert" />
          </label>
          <label>
            Theme:
            <input class="control-input" v-model="theme" placeholder="light-plus, dark-plus, ..." @change="runConvert" />
          </label>
          <label>
            Escape Inside:
            <input class="control-input" v-model="escapeInside" placeholder="<@,@>" @change="runConvert" />
          </label>
        </div>
        <div>
          <a class="link" href="https://textmate-grammars-themes.netlify.app/" target="_blank">
            Click here to search for available languages and themes
          </a>
        </div>
        <h2>Input</h2>
        <textarea v-model="input" @input="runConvert" rows="20" spellcheck="false"></textarea>
      </div>
      <div class="output-box">
        <h2>Prelude</h2>
        <pre>{{ colorDefs.join('\n') }}</pre>
        <h2>LaTeX Output</h2>
        <pre spellcheck="false">{{ output }}</pre>
        <h2>Preview</h2>
        <div v-html="preview"></div>
        <div v-if="error" class="error">Error: {{ error }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
h1 {
  font-size: 2rem;
  margin-bottom: 1rem;
}
h2 {
  margin-bottom: 0.5rem;
  user-select: none;
}
.playground {
  max-width: 90vw;
  min-height: 86vh;
  margin: 2rem auto;
}
.controls {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}
.controls label {
  display: flex;
  flex-direction: column;
  font-size: 1.2rem;
}
.control-input {
  margin-top: 0.5rem;
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 1rem;
}
.boxes {
  display: flex;
  gap: 5rem;
}
.input-box, .output-box {
  flex: 1;
  display: flex;
  flex-direction: column;
}
textarea, pre {
  width: 100%;
  font-family: monospace;
  font-size: 1rem;
  border-radius: 6px;
  border: 1px solid #ccc;
  padding: 0.5rem;
  resize: vertical;
  margin: 0.8rem 0;
}
pre {
  text-wrap: wrap;
}
.error {
  color: #c00;
  margin-top: 1rem;
}
.link {
  color: #007bff;
  text-decoration: none;
}
.link:hover {
  text-decoration: underline;
}
nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.i-mdi-github {
  font-size: 1.8rem;
}
.icon-box {
  padding: 0.5rem;
  margin: 0.1rem;
  border-radius: 6px;
  border: 1px solid #ccc;
  color: #000;
}
</style>

<style>
.shiki {
  width: 100%;
  font-family: monospace;
  font-size: 1rem;
  border-radius: 6px;
  border: 1px solid #ccc;
  padding: 0.5rem;
  resize: vertical;
}
</style>
