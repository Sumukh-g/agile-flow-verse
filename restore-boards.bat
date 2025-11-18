@echo off
echo Restoring boards pages to original state...
git config --global core.pager ""
git restore src/pages/Boards.tsx
git restore src/pages/BoardsSimple.tsx
echo.
echo ✓ Boards restored!
echo.
echo Your boards pages are back to their original working state.
echo.
pause

