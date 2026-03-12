/**
 * Shared text-manipulation helpers used across the backend.
 */

export const removeAccents = (str: string): string =>
  str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/\u0110/g, "D")
    .replace(/[^a-zA-Z0-9]/g, "")

export const getGivenName = (fullName: string): string => {
  const parts = fullName.trim().split(/\s+/)
  return parts[parts.length - 1] ?? fullName.trim()
}

export interface StudentCredentials {
  username: string
  password: string
}

export const generateStudentCredentials = (
  fullName: string,
  phone: string
): StudentCredentials => {
  const givenName = getGivenName(fullName)
  const asciiName = removeAccents(givenName).toLowerCase()
  const nameCapital = asciiName.charAt(0).toUpperCase() + asciiName.slice(1)
  const last3Digits = phone.replace(/\D/g, "").slice(-3)

  return {
    username: phone,
    password: `${nameCapital}${last3Digits}`,
  }
}

export const slugify = (str: string): string => {
  const accentsRemoved = str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/\u0110/g, "D")

  return accentsRemoved
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export const generateTempPassword = (length = 10): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
};

export const normalizePhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, "")
  if (digits.startsWith("84") && digits.length === 11) {
    return "0" + digits.slice(2)
  }
  return digits
}

export const validatePhone = (phone: string): boolean =>
  /^(03|05|07|08|09)\d{8}$/.test(normalizePhone(phone))
