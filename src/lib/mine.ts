const MINE_KEY = "soundboard:mine";
const JUST_ADDED_KEY = "soundboard:just-added";

export function readMine(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(MINE_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

export function rememberMine(ids: string[]) {
  try {
    localStorage.setItem(MINE_KEY, JSON.stringify([...readMine(), ...ids].slice(-50)));
    sessionStorage.setItem(JUST_ADDED_KEY, "1");
  } catch {
    // Storage can be unavailable (private mode); highlighting is a nice-to-have.
  }
}

export function takeJustAdded(): boolean {
  try {
    const value = sessionStorage.getItem(JUST_ADDED_KEY);
    sessionStorage.removeItem(JUST_ADDED_KEY);
    return value === "1";
  } catch {
    return false;
  }
}
