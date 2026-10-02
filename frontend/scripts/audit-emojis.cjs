const fs = require('fs');
const path = require('path');

const sourceRoot = path.join(__dirname, '..', 'src');
const sourceExtensions = /\.(js|jsx|ts|tsx)$/;
const emojiPattern = /[\p{Extended_Pictographic}\u2190-\u21ff\u2300-\u23ff\u2600-\u27bf\u2b00-\u2bff\u2139\u200d\ufe0f]/gu;

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolutePath) : [absolutePath];
  });
}

let matches = 0;

for (const filePath of walk(sourceRoot)) {
  if (!sourceExtensions.test(filePath)) continue;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    const emoji = [...line.matchAll(emojiPattern)].map((match) => match[0]);
    if (!emoji.length) return;

    matches += emoji.length;
    console.log(
      `${path.relative(sourceRoot, filePath)}:${index + 1}: ` +
      `${[...new Set(emoji)].join(' ')} :: ${line.trim()}`,
    );
  });
}

if (matches > 0) {
  console.error(`Found ${matches} emoji or text-icon character(s) in frontend source.`);
  process.exitCode = 1;
} else {
  console.log('No emoji or text-icon characters found in frontend source.');
}
