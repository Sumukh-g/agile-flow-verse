@echo off
if exist dist-api\main.cjs del dist-api\main.cjs
if exist dist-api\main.js ren dist-api\main.js main.cjs

