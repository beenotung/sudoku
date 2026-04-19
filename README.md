# Sudoku Editor

Hosted on [https://sudoku-editor.surge.sh/](https://sudoku-editor.surge.sh/)

## Features

### Visual

- **9×9 grid** — Classic Sudoku board; each 3×3 box uses an alternating **light gray or white** background so the nine blocks are easy to see at a glance.
- **Initial vs entered numbers** — After **Start**, the **initial** digits (fixed in place) use a different style from what you **enter** while solving, so the two are easy to tell apart.
- **Candidate hints** — Optional pencil marks in each cell show which numbers might still fit; they update as you play. You can show or hide them anytime.
- **Highlights** — When you focus a cell that has a number, the matching row, column, and box are highlighted so they are easy to scan at a glance.

### Functions

- **Easy input** — Move around with arrow keys and type digits in cells.
- **Empty** — Quickly resets the board for a new game.
- **Start** — Turn your current layout into the puzzle: cells that already have digits become fixed **initial** numbers; empty cells are where you play.
- **Import / export** — Load or paste puzzles as plain text, or copy the grid to share or save (nine rows of digits; blanks as `_` or space). **Reset** returns the board to the puzzle you last loaded or pasted.
- **Solve** — Fills in whatever the solver can deduce from the current grid; on the hardest puzzles you may still need more steps yourself.
