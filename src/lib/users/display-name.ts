export function getDisplayName(nickname: string | null | undefined, name: string) {
  const trimmedNickname = nickname?.trim();
  return trimmedNickname || name;
}
