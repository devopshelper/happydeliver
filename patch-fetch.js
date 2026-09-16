import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetPath = path.join(__dirname, 'node_modules', '@sveltejs', 'kit', 'src', 'runtime', 'client', 'fetcher.js');

export function patchFetcher() {
  if (!fs.existsSync(targetPath)) {
    return;
  }

  let code = fs.readFileSync(targetPath, 'utf-8');
  let changed = false;

  // Pattern 1: DEV block window.fetch = (input, init) => { ... return native_fetch(input, init); };
  // Pattern 2: BROWSER block window.fetch = (input, init) => { ... return native_fetch(input, init); };
  if (!code.includes('try {\n\t\twindow.fetch =') && !code.includes('try {\r\n\t\twindow.fetch =')) {
    code = code.replace(
      /window\.fetch = \(input, init\) => \{([\s\S]*?return native_fetch\(input, init\);\s*\};)/g,
      'try {\n\t\twindow.fetch = (input, init) => {$1\n\t} catch {}'
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(targetPath, code, 'utf-8');
    console.log('[patch-fetch] Successfully patched @sveltejs/kit fetcher.js to safely assign window.fetch');
  }
}

if (process.argv[1] === __filename) {
  patchFetcher();
}
