const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const generateClassCode = (length = 6): string => {
  let out = '';
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  for (let i = 0; i < length; i++) out += ALPHABET[arr[i] % ALPHABET.length];
  return out;
};
