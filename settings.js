// Goldillion settings. Edit freely.
window.SETTINGS = {
  // Day 1 is this date (YYYY-MM-DD, in each player's local time).
  // Before it, players see a "coming soon" screen.
  releaseDate: "2026-11-24",

  secondsPerQuestion: 25,

  // Gold for an answer that isn't in the list (0 = nothing).
  unlistedPoints: 0,

  // Label for a single answer, by its points. The highest matching "min" wins.
  rarity: [
    { min: 0,  label: "Not on the list" },
    { min: 1,  label: "Plankton" },
    { min: 10, label: "Schooler" },
    { min: 25, label: "Cool" },
    { min: 40, label: "Good!" },
    { min: 60, label: "Rare" },
    { min: 85, label: "Deep Cut" },
    { min: 100, label: "One in a goldillion!!" }
  ],

  // Rank for the day's total (7 questions x 100 = 700 max). Highest matching "min" wins.
  ranks: [
    { min: 0,   name: "Pebble" },
    { min: 150, name: "Copper" },
    { min: 300, name: "Silver" },
    { min: 450, name: "Gold" },
    { min: 600, name: "Goldillion" }
  ]
};
