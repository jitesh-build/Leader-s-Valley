/**
 * Static game data the official API doesn't provide. If Supercell raises a cap, change it here
 * (a district that is already above these numbers is never shown as "over max").
 */
export const CAPITAL_HALL_MAX_LEVEL = 10;
export const DISTRICT_HALL_MAX_LEVEL = 5;

/** The Capital Peak is the Capital Hall's own district. */
export const CAPITAL_PEAK_NAME = "Capital Peak";
/** Its id in the game, used only if the API leaves it out of the district list. */
export const CAPITAL_PEAK_ID = 70000000;