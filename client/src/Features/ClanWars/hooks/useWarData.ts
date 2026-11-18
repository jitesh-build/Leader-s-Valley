import { mockAssignments, mockWar } from "../data/mockWar";

/**
 * Single place the page gets its war from. Today: sample data.
 * Later: fetch from your backend (which calls the Clash of Clans API), run the
 * response through your adapter, and return `{ war, assignments, isSample: false }`.
 */
export function useWarData() {
  return { war: mockWar, assignments: mockAssignments, isSample: true };
}