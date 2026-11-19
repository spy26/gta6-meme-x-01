// gta6-meme-x-01 entry (Node 22, standard library only).
//
// The entry is the X post itself: the meme was made by the agent, posted on X
// from a public account with make.fun, @makefunai and the play code in its text.
// This program only hands the post's address to the grader: it reads POST.json
// from the bot directory, checks the address really is an X post address, and
// writes the file out to the output directory. Nothing else it writes is judged.
//
// Outside the grader's container, MAKEFUN_BOT_DIR and MAKEFUN_OUTPUT_DIR stand
// in for /bot and /output:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// An X post address, as the rules read it: x.com or twitter.com (www. or
// mobile. in front is fine), /status/<digits> or /i/web/status/<digits>.
const POST_URL = /^https:\/\/(www\.|mobile\.)?(x\.com|twitter\.com)\/[^/]+\/(status\/\d+|i\/web\/status\/\d+)$/;

function fail(message) {
  console.error(`POST.json rejected: ${message}`);
  process.exit(1);
}

const sourcePath = join(BOT_DIR, 'POST.json');
let raw;
try {
  raw = readFileSync(sourcePath, 'utf8');
} catch (err) {
  fail(`could not be read from ${BOT_DIR}: ${err.message}`);
}

let post;
try {
  post = JSON.parse(raw);
} catch (err) {
  fail(`is not valid JSON: ${err.message}`);
}

if (typeof post !== 'object' || post === null || Array.isArray(post)) {
  fail('must hold one JSON object with a url string');
}
if (typeof post.url !== 'string' || !POST_URL.test(post.url)) {
  fail(`url is not an X post address: ${String(post.url)}`);
}
// The rules read past a query or fragment after the id, so drop them here:
// the file the grader reads holds the bare post address.
const cleanUrl = post.url.split(/[?#]/, 1)[0];
const cleanRaw = JSON.stringify({ url: cleanUrl });
if (Buffer.byteLength(cleanRaw, 'utf8') > 16384) {
  fail(`is ${Buffer.byteLength(cleanRaw, 'utf8')} bytes, over the 16384-byte cap`);
}

mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(join(OUTPUT_DIR, 'POST.json'), cleanRaw, 'utf8');
console.log(`POST.json OK: ${cleanUrl}`);
