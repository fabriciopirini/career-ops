export function commitText({ read, write, next, expected }) {
  if (typeof read !== 'function' || typeof write !== 'function') throw new TypeError('read and write must be functions');
  if (typeof next !== 'string') throw new TypeError('next must be a string');
  const previous = read();
  if (expected !== undefined && previous !== expected) {
    return { status: 'conflict', bytes: previous };
  }
  try {
    write(next);
    return { status: 'committed', bytes: next };
  } catch (error) {
    try {
      write(previous);
    } catch {
      // Best effort rollback; caller still receives the original failure.
    }
    return { status: 'failed', bytes: read(), error };
  }
}
