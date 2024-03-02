import fs from 'fs/promises';
import path from 'path';

const filePath = process.argv[2];
const outputFlag = process.argv.indexOf('--out');
if (!filePath) {
  throw new Error('No file path provided');
}

const md = await fs.readFile(filePath, 'utf-8');
const markers = ['**', '`', '_', '\n\n'];
const parts = md.split('```');

for (let i = 0; i < parts.length; i++) {
  if (i % 2 === 0) {
    const boldParts = parts[i].match(/(\*\*[^*]+\*\*)/g);
    if (boldParts) {
      boldParts.forEach(part => {
        const content = part.slice(2, -2);
        if (content.includes(markers[0]) || content.includes(markers[1]) || content.includes(markers[2])) {
          throw new Error('Nested markers are not allowed');
        }
        parts[i] = parts[i].replace(part, `<b>${content}</b>`);
      });
    }
  }
}

for (let i = 0; i < parts.length; i++) {
  if (i % 2 === 0) {
    const monospaceParts = parts[i].match(/(`[^`]+`)/g);
    if (monospaceParts) {
      monospaceParts.forEach(part => {
        const content = part.slice(1, -1);
        if (content.includes(markers[0]) || content.includes(markers[1]) || content.includes(markers[2])) {
          throw new Error('Nested markers are not allowed');
        }
        parts[i] = parts[i].replace(part, `<tt>${content}</tt>`);
      });
    }
  }
}

for (let i = 0; i < parts.length; i++) {
  if (i % 2 === 0) {
    const italicParts = parts[i].match(/(_[^_]+_)/g);
    if (italicParts) {
      italicParts.forEach(part => {
        const content = part.slice(1, -1);
        if (content.includes(markers[0]) || content.includes(markers[1]) || content.includes(markers[2])) {
          throw new Error('Nested markers are not allowed');
        }
        parts[i] = parts[i].replace(part, `<i>${content}</i>`);
      });
    }
  }
}

for (let i = 0; i < parts.length; i++) {
  if (i % 2 === 0) {
    if (parts[i].includes(markers[3])) {
      const paragraphs = parts[i].split(markers[3]);
      for (let j = 0; j < paragraphs.length; j++) {
        paragraphs[j] = `<p>${paragraphs[j].trim()}</p>`;
      }
      parts[i] = paragraphs.join('\n');
    }
  } else {
    if (!parts[i].startsWith('\n')) {
      throw new Error('Should be line break after preformatted marker');
    }
    parts[i] = `\n<pre>${parts[i]}</pre>`;
  }
}

if (outputFlag !== -1 && process.argv[outputFlag + 1]) {
  const outputPath = path.resolve(process.argv[outputFlag + 1]);
  fs.writeFile(outputPath, parts.join(''));
} else {
  console.log(parts.join(''));
}
