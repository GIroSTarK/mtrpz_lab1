import fs from 'fs/promises';
import path from 'path';

const filePath = process.argv[2];
const outputFlag = process.argv.indexOf('--out');
if (!filePath) {
  throw new Error('No file path provided');
}

const md = await fs.readFile(filePath, 'utf-8');
const markers = ['**', '_', '`', '\n\n'];
const parts = md.split('```');
if (parts.length % 2 === 0) {
  throw new Error('Invalid markdown syntax');
}

const boldRegex =
  /(?<=[ ,.:;\n\t]|^)\*\*(?=\S)(.+?)(?<=\S)\*\*(?=[ ,.:;\n\t]|$)/g;
const italicRegex = /(?<=[ ,.:;\n\t]|^)_(?=\S)(.+?)(?<=\S)_(?=[ ,.:;\n\t]|$)/g;
const monospacedRegex =
  /(?<=[ ,.:;\n\t]|^)`(?=\S)(.+?)(?=\S)`(?=[ ,.:;\n\t]|$)/g;
  
function convert(regex, marker, tag) {
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      const markedParts = parts[i].match(regex);
      if (markedParts) {
        markedParts.forEach((part) => {
          const content = part.slice(marker.length, -marker.length);
          const nestedMarksCount = (marker) =>
            content.split('').filter((char) => char === marker).length;
          if (
            nestedMarksCount('*') > 3 ||
            nestedMarksCount(markers[1]) > 1 ||
            nestedMarksCount(markers[2]) > 1
          ) {
            throw new Error('Nested markers are not allowed');
          }
          parts[i] = parts[i].replace(part, `<${tag}>${content}</${tag}>`);
        });
      }
    }
  }
}

convert(boldRegex, markers[0], 'b');
convert(italicRegex, markers[1], 'i');
convert(monospacedRegex, markers[2], 'tt');

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
