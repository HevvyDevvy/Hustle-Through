// Seed data derived from Hustle_Through_Level_Design.md.
// Rank 1 (Rookie) is fully seeded here as the pattern. Extend this array with
// the remaining ranks/levels from the design doc — same shape throughout.
// Run `npm run seed:jobs` (see scripts/seedJobs.ts) to load these into Postgres.

export interface JobSeed {
  id: string;
  level: number;
  rankRequired: number;
  title: string;
  location: string;
  taskDescription: string;
  cashReward: number;
  isStoryGate: boolean;
  isBonusPool: boolean;
  storyFlagsSet?: Record<string, unknown>;
}

export const jobSeeds: JobSeed[] = [
  {
    id: "lvl-01-ask-for-granny-doreen",
    level: 1,
    rankRequired: 1,
    title: "Ask for Granny Doreen",
    location: "Southside street",
    taskDescription: "Mow and tidy an elderly neighbour's garden for cash-in-hand.",
    cashReward: 20,
    isStoryGate: false,
    isBonusPool: false,
  },
  {
    id: "lvl-02-wee-message-run",
    level: 2,
    rankRequired: 1,
    title: "The Wee Message Run",
    location: "Local corner shop",
    taskDescription: "Deliver a parcel across the scheme without being seen by nosy neighbours.",
    cashReward: 25,
    isStoryGate: false,
    isBonusPool: false,
  },
  {
    id: "lvl-03-bike-retrieval-service",
    level: 3,
    rankRequired: 1,
    title: "Bike Retrieval Service",
    location: "Local estate",
    taskDescription: "Recover a 'borrowed' bike from a rival kid's shed, stealth-based.",
    cashReward: 30,
    isStoryGate: false,
    isBonusPool: false,
  },
  {
    id: "lvl-04-dog-watching-cash-only",
    level: 4,
    rankRequired: 1,
    title: "Dog Watching, Cash Only",
    location: "Kelvingrove Park",
    taskDescription: "Walk and mind three dogs at once without losing any.",
    cashReward: 30,
    isStoryGate: false,
    isBonusPool: false,
  },
  {
    id: "lvl-05-family-first",
    level: 5,
    rankRequired: 1,
    title: "Family First",
    location: "Home base",
    taskDescription: "Personal mission: help your cousin move flat, no pay, +reputation with family.",
    cashReward: 0,
    isStoryGate: true,
    isBonusPool: false,
    storyFlagsSet: { robbie_relationship: "warm", robbie_age_stage: "child" },
  },

  // --- Cash-in-hand bonus pool (Rookie–Younger tier, repeatable/optional) ---
  {
    id: "bonus-window-wangle",
    level: 1,
    rankRequired: 1,
    title: "Window Wangle",
    location: "Southside street",
    taskDescription:
      "Steal a ladder to do a window-cleaning round, then sneak it back before the owner notices.",
    cashReward: 15,
    isStoryGate: false,
    isBonusPool: true,
  },
  {
    id: "bonus-bank-holiday-bouncer",
    level: 1,
    rankRequired: 1,
    title: "Bank Holiday Bouncer",
    location: "The Long Bar",
    taskDescription:
      "Work the door over a bank holiday weekend; job can end early in a scripted brawl but still pays out.",
    cashReward: 40,
    isStoryGate: false,
    isBonusPool: true,
  },
  {
    id: "bonus-valentines-shift",
    level: 2,
    rankRequired: 1,
    title: "Valentine's Shift",
    location: "Corner café kitchen",
    taskDescription:
      "Grind dishwashing shifts ahead of Valentine's Day for staff discount + spare cash.",
    cashReward: 25,
    isStoryGate: false,
    isBonusPool: true,
  },
  {
    id: "bonus-creative-paperwork",
    level: 2,
    rankRequired: 1,
    title: "Creative Paperwork",
    location: "DWP office (fictionalised)",
    taskDescription:
      "Dialogue mini-game fudging a benefits form for extra cash; light 'flagged' status risk as a running joke.",
    cashReward: 20,
    isStoryGate: false,
    isBonusPool: true,
    storyFlagsSet: { dwp_flagged: true },
  },
  {
    id: "bonus-one-sick-stem",
    level: 3,
    rankRequired: 1,
    title: "One Sick Stem",
    location: "Back garden allotment",
    taskDescription:
      "Grow-and-sell job that gets raided the day after harvest — near-total failure, nets one plant and a £10 fine.",
    cashReward: -10, // narrative beat: this job is a deliberate net loss
    isStoryGate: false,
    isBonusPool: true,
  },
];
