import fs from 'fs/promises';
import path from 'path';
import os from 'node:os';

const filePath = process.argv[2];
const outputFlag = process.argv.indexOf('--out');

const boldRegex =
  /(?<=[ ,.:;\n\t]|^)\*\*(?=\S)(.+?)(?<=\S)\*\*(?=[ ,.:;\n\t]|$)/g;
const italicRegex = /(?<=[ ,.:;\n\t]|^)_(?=\S)(.+?)(?<=\S)_(?=[ ,.:;\n\t]|$)/g;
const monospacedRegex =
  /(?<=[ ,.:;\n\t]|^)`(?=\S)(.+?)(?=\S)`(?=[ ,.:;\n\t]|$)/g;
const regexps = [boldRegex, italicRegex, monospacedRegex];

const leftBold = /(?<=[ ,.:;\n\t]|^)\*\*(?=\S)/g;
const rightBold = /(?<=\S)\*\*(?=[ ,.:;\n\t]|$)/g;
const leftItalic = /(?<=[ ,.:;\n\t]|^)_(?=\S)/g;
const rightItalic = /(?<=\S)_(?=[ ,.:;\n\t]|$)/g;
const leftMonospaced = /(?<=[ ,.:;\n\t]|^)`(?=\S)/g;
const rightMonospaced = /(?=\S)`(?=[ ,.:;\n\t]|$)/g;

const markers = ['**', '_', '`'];
const md = await fs.readFile(filePath, 'utf-8');

const setParagraphs = (text) => {
  const paragraphs = text.split(`${os.EOL}${os.EOL}`).filter((par) => par.trim() !== '');
  const htmlParagraphs = paragraphs.map((par) => `<p>${par.trim()}</p>${os.EOL}`);

  return htmlParagraphs.join('');
};

const setPreformattedParts = (text) => {
  if (!text.startsWith(`${os.EOL}`)) {
    throw new Error('Should be line break after preformatted marker');
  }
  if (!text.endsWith(`${os.EOL}`)) {
    throw new Error('Should be line break before last preformatted marker');
  }

  return `<pre>${text}</pre>${os.EOL}`;
};

const setHtmlTags = (text) => {
  return text
    .replace(boldRegex, '<b>$1</b>')
    .replace(italicRegex, '<i>$1</i>')
    .replace(monospacedRegex, '<tt>$1</tt>');
};

const isMarkerClosedChecker = (text, leftRegex, rightRegex, regex) => {
  const matchedMarkers = text.match(regex);
  const matchedLeftMarkers = text.match(leftRegex);
  const matchedRightMarkers = text.match(rightRegex);

  const markersLength = matchedMarkers ? matchedMarkers.length * 2 : 0;
  const leftMarkersLength = matchedLeftMarkers ? matchedLeftMarkers.length : 0;
  const rightMarkersLength = matchedRightMarkers ? matchedRightMarkers.length : 0;

  if (leftMarkersLength + rightMarkersLength !== markersLength) {
    throw new Error('There is no closing marker');
  }
};

const nestedMarkersChecker = (text, regex, marker) => {
  const parts = text.match(regex);
  if (parts) {
    for (const part of parts) {
      const slicedPart = part.slice(marker.length, -marker.length);
      if (
        slicedPart.length > 2 &&
        (markers.includes(slicedPart[0] + slicedPart[1]) ||
          markers.includes(
            slicedPart[slicedPart.length - 1] +
              slicedPart[slicedPart.length - 2]
          ))
      ) {
        throw new Error('Nested markers are not allowed');
      }
      if (
        slicedPart.length > 1 &&
        (markers.includes(slicedPart[0]) ||
          markers.includes(slicedPart[slicedPart.length - 1]))
      ) {
        throw new Error('Nested markers are not allowed');
      }
      if (
        slicedPart.match(/\*\*/g)?.length > 1 ||
        slicedPart.match(/_/g)?.length > 1 ||
        slicedPart.match(/`/g)?.length > 1
      ) {
        throw new Error('Nested markers are not allowed');
      }
    }
  }
};

const markdownToHTML = () => {
  const parts = md.split('```');
  if (parts.length % 2 === 0) {
    throw new Error('No closing preformatted marker provided');
  }

  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      isMarkerClosedChecker(parts[i], leftBold, rightBold, boldRegex);
      isMarkerClosedChecker(parts[i], leftItalic, rightItalic, italicRegex);
      isMarkerClosedChecker(
        parts[i],
        leftMonospaced,
        rightMonospaced,
        monospacedRegex
      );
      regexps.forEach((regex, index) =>
        nestedMarkersChecker(parts[i], regex, markers[index])
      );
      parts[i] = setHtmlTags(parts[i]);
      parts[i] = setParagraphs(parts[i]);
    } else {
      parts[i] = setPreformattedParts(parts[i]);
    }
  }

  return parts.join('');
};

if (outputFlag !== -1 && process.argv[outputFlag + 1]) {
  const outputPath = path.resolve(process.argv[outputFlag + 1]);
  fs.writeFile(outputPath, markdownToHTML());
} else {
  console.log(markdownToHTML());
}
