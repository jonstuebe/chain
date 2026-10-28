# Chain

A daily word ladder: every player gets the same start and target word and climbs from one to the other, changing one letter per step.

## Language

**Puzzle**:
The single daily challenge every player shares: a start word, a target word, and a par route between them.
_Avoid_: Round, level, daily

**Puzzle number**:
The position of a Puzzle counted from the Launch date, where the Launch date's Puzzle is #1.
_Avoid_: Day number, puzzle id

**Launch date**:
The local calendar date on which Puzzle #1 is played.

**Chain**:
The words a player has climbed so far, from the start word to the current word. Also the game's name.
_Avoid_: Path, guesses

**Step**:
One move up the Chain: a real word that differs from the previous word in exactly one letter.
_Avoid_: Guess, move, turn

**Par**:
The number of Steps in the shortest possible Chain for a Puzzle. Matching it is a perfect score.

**Par route**:
One shortest Chain, stored with the Puzzle and shown when the Puzzle ends.
_Avoid_: Solution, answer

**Hint**:
A highlight on the letter to change next to get one Step closer to the target. Each costs one stroke.

**Climb back**:
Returning to an earlier word in the Chain, dropping every Step after it. Free, like Undo.

**Dead end**:
A word with no route to the target at all.
