# !/bin/bash

npx vue-tsc --noEmit 2>&1 | head -30


npx vite build 2>&1 && npx wrangler pages deploy dist --project-name piano-practise --commit-dirty=true 2>&1

