import { $ } from "bun";

await $`cd ${import.meta.dir}/.. && rm -f submission.zip && zip -r submission.zip . \
  -x ".git/*" \
  -x "node_modules/*" \
  -x ".DS_Store" \
  -x "*/.DS_Store" \
  -x "out/*" \
  -x "dist/*" \
  -x "coverage/*" \
  -x "*.lcov" \
  -x "*.tgz" \
  -x "*.tsbuildinfo" \
  -x ".env*" \
  -x ".idea/*" \
  -x ".vscode/*" \
  -x ".cache/*" \
  -x "logs/*" \
  -x "submission.zip"`;

console.log("Created submission.zip");
