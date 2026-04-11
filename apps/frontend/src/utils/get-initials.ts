export function getInitials(
  name?: string,
  preferredUsername?: string,
  email?: string,
): string {
  const source = name || preferredUsername || email || '?';
  const parts = source.trim().split(/\s+/);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}
