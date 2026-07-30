-- Tokens & Extras are inferred (token vs non-token related); drop editable extras board.
ALTER TYPE "CardRelationComponent" RENAME VALUE 'emblem' TO 'extra';

DELETE FROM "deck_cards" WHERE "board" = 'extras';
