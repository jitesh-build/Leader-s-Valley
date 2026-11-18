/**
 * Town Hall pictures.
 * Download them from the clash-of-clans-data repo (images/home/town-hall/normal/)
 * and put them in  public/town-hall/  keeping the original names:
 *   public/town-hall/level-12.png, level-13.png, … level-18.png
 * Change the path here if you store them somewhere else.
 */
export const thImage = (level: number): string => `/town-hall/level-${level}.png`;