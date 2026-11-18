import { mockMembers } from "../data/mockMembers";

/**
 * Single place the page gets its roster from. Today: sample data.
 * Later: fetch from your backend, adapt it to the `Member` type, return isSample: false.
 */
export function useMembers() {
  return { members: mockMembers, isSample: true };
}