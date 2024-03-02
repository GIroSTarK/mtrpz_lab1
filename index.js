import fs from 'fs/promises';
import path from 'path';

const filePath = process.argv[2];
const outputFlag = process.argv.indexOf('--out');
if (!filePath) {
  throw new Error('No file path provided');
}

let res;
const md = await fs.readFile(filePath, 'utf-8');
const markers = ['**', '`', '_', '\n\n'];
const parts = md.split('```');

for (let i = 0; i < parts.length; i++) {
  if (i % 2 === 0) {
    if (parts[i].includes(markers[0])) {
      const boldParts = parts[i].split(markers[0]);
      if (boldParts.length < 3) {
        throw new Error('Invalid markdown syntax');
      }
      for (let j = 0; j < boldParts.length; j++) {
        if (j % 2 === 0) {
          continue;
        } else {
          if (
            boldParts[j].includes(markers[1]) ||
            boldParts[j].includes(markers[2])
          ) {
            throw new Error('Invalid markdown syntax');
          }
          boldParts[j] = `<b>${boldParts[j]}</b>`;
        }
      }
      parts[i] = boldParts.join('');
    }
  } else {
    continue;
  }
}

console.log(parts);

// const boldText = /\*\*(.*)\*\*/g;
// const italicText = /_(.*?)_/g;
// const monospaceText = /`([^`]+)`/g;

// for (let i = 0; i < md.length; i++) {
//   if (md[i] === '`' && md[i + 1] === '`' && md[i + 2] === '`') {

//   } else if (
//     (md[i] === '*' && md[i + 1] === '*' && markers.includes(md[i + 2]))
//     (markers.includes(md[i]) && md[i + 1] === '*' && md[i + 2] === '*')
//   ) {
//     throw new Error('Invalid markdown syntax');
//   } else if (markers.includes(md[i]) && markers.includes(md[i + 1])) {
//     throw new Error('Invalid markdown syntax');
//   }
// }

// res = md
//   .replace(boldText, '<b>$1</b>')
//   .replace(italicText, '<i>$1</i>')
//   .replace(monospaceText, '<tt>$1</tt>');
// const res = md.replace(regex, '<b>$1<b/>');

// if (outputFlag !== -1 && process.argv[outputFlag + 1]) {
//   const outputPath = path.resolve(process.argv[outputFlag + 1]);
//   fs.writeFile(outputPath, res);
// } else {
//   console.log(res);
// }
