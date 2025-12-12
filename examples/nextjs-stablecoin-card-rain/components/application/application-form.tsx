"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { AddressAutocomplete } from "@/components/application/address-autocomplete";
import { Calendar as DateInput } from "@/components/application/calendar";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { OCCUPATION_OPTIONS, US_STATES } from "@/constants";
import {
  getAuthToken,
  useDynamicContext,
  useIsLoggedIn,
  useRefreshUser,
} from "@/lib/dynamic";
import type { CreateCardForUserResponse } from "@/lib/rain";
import { cn } from "@/lib/utils";
import {
  formatNumberWithCommas,
  parseNumberFromFormatted,
} from "@/utils/format-number";
import { formatPhone } from "@/utils/format-phone";
import { formatSSN } from "@/utils/format-ssn";
import { defaultValues, FormSchema, STEPS } from "./helpers";

export default function ApplicationForm({ formId }: { formId: string }) {
  const { sdkHasLoaded, user, setShowAuthFlow } = useDynamicContext();
  const refreshUser = useRefreshUser();
  const isLoggedIn = useIsLoggedIn();

  useEffect(() => {
    const metadata = user?.metadata as { rainCard?: CreateCardForUserResponse };
    if (metadata?.rainCard) redirect("/card");
  }, [user]);

  useEffect(() => {
    if (sdkHasLoaded && !isLoggedIn) {
      setShowAuthFlow(true);
    }
  }, [sdkHasLoaded, isLoggedIn, setShowAuthFlow]);

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    ok: boolean;
    data?: any;
    error?: string;
  } | null>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: defaultValues(user?.email),
  });

  const fillWithTestData = () => form.reset(defaultValues(user?.email, true));

  const isFirst = currentStep === 0;
  const isLast = currentStep === STEPS.length - 1;

  const handleBack = () => setCurrentStep((s) => Math.max(s - 1, 0));
  const handleNext = async () => {
    const valid = await form.trigger(STEPS[currentStep].fields as any, {
      shouldFocus: true,
    });
    if (!valid) return;
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  // Show loading state until mounted to prevent hydration mismatches
  if (!isLoggedIn) {
    return (
      <div className="text-center space-y-4 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-48 mx-auto mb-2" />
          <div className="h-4 bg-muted rounded w-64 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        id={formId}
        className="space-y-6"
        onSubmit={form.handleSubmit(async (data) => {
          setIsSubmitting(true);
          setSubmitResult(null);

          try {
            const authToken = getAuthToken();
            if (!authToken) throw new Error("Not authenticated");

            const response = await fetch("/api/apply", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
              },
              body: JSON.stringify({ ...data }),
            });

            const result = await response.json();

            if (!response.ok) {
              throw new Error(result.error || "Application submission failed");
            }

            setSubmitResult({ ok: true, data: result });
            refreshUser();
            redirect("/card");
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "An error occurred";
            setSubmitResult({ ok: false, error: errorMessage });
          } finally {
            setIsSubmitting(false);
          }
        })}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !isLast) {
            e.preventDefault();
            void handleNext();
          }
        }}
      >
        {/* Stepper */}
        <div className="grid grid-cols-3 items-center mb-3">
          {STEPS.map((step, idx) => (
            <div key={step.title} className="flex items-center gap-2">
              <div
                className={`${
                  idx <= currentStep
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                } flex size-6 items-center justify-center rounded-full text-xs font-medium`}
              >
                {idx + 1}
              </div>
              <span
                className={`text-sm ${
                  idx === currentStep ? "font-medium" : "text-muted-foreground"
                }`}
              >
                {step.title}
              </span>
            </div>
          ))}
        </div>
        <div className="h-0.5 w-full rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
          />
        </div>

        {currentStep === 0 && (
          <div className="grid grid-cols-1 gap-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane" {...field} name="firstName" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} name="lastName" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Birth date</FormLabel>
                    <FormControl>
                      <DateInput {...field} name="birthDate" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nationalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Social Security Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123-45-6789"
                        inputMode="numeric"
                        autoComplete="off"
                        name="nationalId"
                        value={formatSSN(field.value as string)}
                        onChange={(e) => {
                          const digits = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 9);
                          field.onChange(digits);
                        }}
                        onBlur={field.onBlur}
                        ref={field.ref}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="grid grid-cols-1 gap-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        name="email"
                        value={user?.email || ""}
                        disabled
                        readOnly
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(555) 123-4567"
                        inputMode="tel"
                        name="phoneNumber"
                        value={formatPhone(field.value)}
                        onChange={(e) => {
                          const digits = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 15);
                          field.onChange(digits);
                        }}
                        onBlur={field.onBlur}
                        ref={field.ref}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="address.line1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address line 1</FormLabel>
                    <FormControl>
                      <AddressAutocomplete
                        country={
                          (form.watch("address.countryCode") as string) || "US"
                        }
                        defaultValue={(field.value as string) || ""}
                        onChange={(value) => {
                          field.onChange(value);
                        }}
                        onPick={(d) => {
                          form.setValue("address.line1", d.line1, {
                            shouldDirty: true,
                          });
                          form.setValue("address.city", d.city, {
                            shouldDirty: true,
                          });
                          if (d.region)
                            form.setValue("address.region", d.region as any, {
                              shouldDirty: true,
                            });
                          if (d.postalCode)
                            form.setValue("address.postalCode", d.postalCode, {
                              shouldDirty: true,
                            });
                          if (d.countryCode)
                            form.setValue(
                              "address.countryCode",
                              d.countryCode as any,
                              { shouldDirty: true }
                            );
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address.line2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address line 2</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Apt, suite, etc. (optional)"
                        {...field}
                        name="address.line2"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="address.city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="San Francisco"
                        {...field}
                        name="address.city"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address.region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <select
                        className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                        value={field.value}
                        onChange={field.onChange}
                        name="address.region"
                      >
                        {US_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address.postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="94105"
                        {...field}
                        name="address.postalCode"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="grid grid-cols-1 gap-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="occupation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Occupation</FormLabel>
                    <FormControl>
                      <select
                        className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                        value={field.value}
                        onChange={field.onChange}
                        name="occupation"
                      >
                        <option value="">Select an occupation</option>
                        {OCCUPATION_OPTIONS.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="annualSalary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Annual salary (USD)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="120,000"
                        inputMode="numeric"
                        name="annualSalary"
                        value={formatNumberWithCommas(field.value)}
                        onChange={(e) => {
                          const digits = parseNumberFromFormatted(
                            e.target.value
                          );
                          field.onChange(digits);
                        }}
                        onBlur={field.onBlur}
                        ref={field.ref}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="accountPurpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account purpose</FormLabel>
                    <FormControl>
                      <select
                        className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                        value={field.value}
                        onChange={field.onChange}
                        name="accountPurpose"
                      >
                        <option value="spending">Spending</option>
                        <option value="savings">Savings</option>
                        <option value="business">Business</option>
                        <option value="other">Other</option>
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expectedMonthlyVolume"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected monthly volume (USD)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="5,000"
                        inputMode="numeric"
                        name="expectedMonthlyVolume"
                        value={formatNumberWithCommas(field.value)}
                        onChange={(e) => {
                          const digits = parseNumberFromFormatted(
                            e.target.value
                          );
                          field.onChange(digits);
                        }}
                        onBlur={field.onBlur}
                        ref={field.ref}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="isTermsOfServiceAccepted"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <input
                      id={`tos`}
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      name="isTermsOfServiceAccepted"
                    />
                    <FormLabel htmlFor="tos">
                      I accept the Terms of Service
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>
        )}

        <div className="col-span-1 md:col-span-3 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={isFirst}
          >
            Back
          </Button>

          <Button
            variant="link"
            onClick={fillWithTestData}
            className="text-xs text-muted-foreground underline hover:text-primary"
          >
            Prefill Sample Data
          </Button>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={handleNext}
              className={cn(isLast && "hidden")}
            >
              Next
            </Button>
            <Button
              type="submit"
              className={cn(!isLast && "hidden")}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>

        {submitResult?.error && (
          <div className="text-destructive text-sm">{submitResult.error}</div>
        )}
        {submitResult?.ok && (
          <div className="text-green-600 text-sm">
            Application submitted successfully!
          </div>
        )}
      </form>
    </Form>
  );
}
