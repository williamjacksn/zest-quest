import { mkdir, cp, copyFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('.'),
  dist = path.join(root, 'dist');
await mkdir(dist, { recursive: true });
for (const file of ['index.html', 'styles.css', 'favicon.svg'])
  await copyFile(path.join(root, file), path.join(dist, file));
for (const directory of ['src', 'Lemonectric - Zest Quest'])
  await cp(path.join(root, directory), path.join(dist, directory), { recursive: true });
let files = 0,
  bytes = 0;
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const location = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(location);
    else {
      files++;
      bytes += (await stat(location)).size;
    }
  }
}
await walk(dist);
console.log(`Built ${files} static files (${(bytes / 1024 / 1024).toFixed(1)} MiB) in ${dist}`);
