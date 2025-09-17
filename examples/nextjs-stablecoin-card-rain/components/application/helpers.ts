import { z } from "zod";

export const FormSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  birthDate: z
    .string()
    .min(1)
    .refine(
      (dateString) => {
        const birthDate = new Date(dateString);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        // Adjust age if birthday hasn't occurred this year
        const adjustedAge =
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
            ? age - 1
            : age;

        return adjustedAge >= 21;
      },
      { message: "You must be at least 21 years old to apply." }
    ),
  nationalId: z.string().min(1),
  email: z.string(),
  phoneNumber: z.string().min(4),
  address: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    region: z.string().length(2),
    postalCode: z.string().min(3),
    countryCode: z.string().min(2).max(2),
  }),
  occupation: z.string().min(1),
  annualSalary: z.string().min(1),
  accountPurpose: z.enum(["spending", "savings", "business", "other"]),
  expectedMonthlyVolume: z.string().min(1),
  isTermsOfServiceAccepted: z
    .boolean()
    .refine((v) => v, { message: "You must accept the Terms of Service." }),
});

// Test data for demo purposes
export const TEST_DATA = {
  firstName: "John",
  lastName: "Doe",
  birthDate: "2000-04-20",
  nationalId: "123456789", // Test SSN (will be formatted as 123-45-6789)
  phoneNumber: "5551234567", // Will be formatted as (555) 123-4567
  address: {
    line1: "123 Main Street",
    line2: "",
    city: "San Francisco",
    region: "CA",
    postalCode: "94105",
    countryCode: "US",
  },
  occupation: "11-3031", // Financial Managers
  annualSalary: "120000",
  accountPurpose: "spending" as const,
  expectedMonthlyVolume: "2500",
  isTermsOfServiceAccepted: false,
};

export const defaultValues = (
  email: string | undefined,
  useTestData = false
) => {
  if (useTestData) {
    return {
      ...TEST_DATA,
      email: email || "john.doe@example.com",
    };
  }

  return {
    firstName: "",
    lastName: "",
    birthDate: "",
    nationalId: "",
    email: email || "",
    phoneNumber: "",
    address: {
      line1: "",
      line2: "",
      city: "",
      region: "CA",
      postalCode: "",
      countryCode: "US",
    },
    occupation: "",
    annualSalary: "",
    accountPurpose: "spending" as const,
    expectedMonthlyVolume: "",
    isTermsOfServiceAccepted: false,
  };
};

export const STEPS = [
  {
    title: "Personal",
    fields: ["firstName", "lastName", "birthDate", "nationalId"],
  },
  {
    title: "Address",
    fields: [
      "phoneNumber",
      "address.line1",
      "address.city",
      "address.region",
      "address.postalCode",
      "address.countryCode",
    ],
  },
  {
    title: "Financial",
    fields: [
      "occupation",
      "annualSalary",
      "accountPurpose",
      "expectedMonthlyVolume",
      "isTermsOfServiceAccepted",
    ],
  },
];
