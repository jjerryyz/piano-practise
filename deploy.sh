# !/bin/bash

cd "d:\Workspace\i\piano-practise" && npx vue-tsc --noEmit 2>&1 | head -30


cd "d:\Workspace\i\piano-practise" && npx vite build 2>&1 && npx wrangler pages deploy dist --project-name piano-practise --commit-dirty=true 2>&1

