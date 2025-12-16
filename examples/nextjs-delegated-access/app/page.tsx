import DelegatedAccess from "@/components/dynamic/delegated-access";
import DelegationHero from "@/components/info/delegation-hero";
import DelegationSteps from "@/components/info/delegation-steps";
import DelegationUseCases from "@/components/info/delegation-use-cases";

export default function Main() {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-8 pt-16">
      <DelegationHero />
      <DelegationSteps />
      <DelegatedAccess />
      <DelegationUseCases />
    </div>
  );
}
