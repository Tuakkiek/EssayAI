import {
  removeAccents,
  getGivenName,
  generateStudentCredentials,
  slugify,
  normalizePhone,
  validatePhone,
} from "../textUtils"

describe("removeAccents", () => {
  test("strips Vietnamese diacritical marks", () => {
    expect(removeAccents("Ki\u1ec7t")).toBe("Kiet")
    expect(removeAccents("Nguy\u1ec5n")).toBe("Nguyen")
    expect(removeAccents("Tr\u1ea7n")).toBe("Tran")
    expect(removeAccents("L\u00ea")).toBe("Le")
    expect(removeAccents("Ph\u01b0\u01a1ng")).toBe("Phuong")
  })

  test("converts d-stroke to d", () => {
    expect(removeAccents("\u0110\u1ee9c")).toBe("Duc")
    expect(removeAccents("\u0111\u01b0\u1eddng")).toBe("duong")
  })

  test("removes non-alphanumeric characters", () => {
    expect(removeAccents("hello world")).toBe("helloworld")
    expect(removeAccents("abc-123")).toBe("abc123")
  })

  test("handles empty string", () => {
    expect(removeAccents("")).toBe("")
  })
})

describe("getGivenName", () => {
  test("returns last word of a full name", () => {
    expect(getGivenName("Nguyen Tuan Kiet")).toBe("Kiet")
    expect(getGivenName("Tran Thi Lan")).toBe("Lan")
    expect(getGivenName("Le Van An")).toBe("An")
  })

  test("returns single name as-is", () => {
    expect(getGivenName("An")).toBe("An")
  })

  test("handles extra whitespace", () => {
    expect(getGivenName("  Nguyen  Tuan  Kiet  ")).toBe("Kiet")
  })
})

describe("generateStudentCredentials", () => {
  test("generates expected credentials for example", () => {
    const creds = generateStudentCredentials("Nguyen Tuan Kiet", "0848549959")
    expect(creds.username).toBe("0848549959")
    expect(creds.password).toBe("Kiet959")
  })

  test("capitalises first letter of given name", () => {
    const creds = generateStudentCredentials("tran thi lan", "0912345678")
    expect(creds.password).toBe("Lan678")
  })

  test("strips accents from Vietnamese name", () => {
    const creds = generateStudentCredentials("Nguy\u1ec5n Tu\u1ea5n Ki\u1ec7t", "0848549959")
    expect(creds.password).toBe("Kiet959")
  })

  test("uses last 3 digits of phone", () => {
    const creds = generateStudentCredentials("Le Van An", "0901122334")
    expect(creds.password).toBe("An334")
  })
})

describe("slugify", () => {
  test("converts center name to slug", () => {
    expect(slugify("Trung T\u00e2m Ti\u1ebfng Anh ABC")).toBe("trung-tam-tieng-anh-abc")
  })

  test("collapses multiple hyphens", () => {
    expect(slugify("hello   world")).toBe("hello-world")
  })

  test("removes leading/trailing hyphens", () => {
    expect(slugify("  hello  ")).toBe("hello")
  })
})

describe("normalizePhone", () => {
  test("removes spaces from phone number", () => {
    expect(normalizePhone("084 854 9959")).toBe("0848549959")
  })

  test("converts +84 prefix to 0", () => {
    expect(normalizePhone("+84848549959")).toBe("0848549959")
  })

  test("converts 84 prefix to 0", () => {
    expect(normalizePhone("84848549959")).toBe("0848549959")
  })
})

describe("validatePhone", () => {
  test("accepts valid Vietnamese mobile numbers", () => {
    expect(validatePhone("0848549959")).toBe(true)
    expect(validatePhone("0912345678")).toBe(true)
    expect(validatePhone("0376543210")).toBe(true)
    expect(validatePhone("0581234567")).toBe(true)
    expect(validatePhone("0761234567")).toBe(true)
  })

  test("rejects numbers with wrong prefix", () => {
    expect(validatePhone("0112345678")).toBe(false)
    expect(validatePhone("0212345678")).toBe(false)
  })

  test("rejects numbers that are too short", () => {
    expect(validatePhone("09123")).toBe(false)
  })

  test("accepts with spaces (normalizes first)", () => {
    expect(validatePhone("084 854 9959")).toBe(true)
  })
})
