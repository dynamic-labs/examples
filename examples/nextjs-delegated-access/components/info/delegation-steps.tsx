import { Key, Server, ShieldCheck } from "lucide-react";

const steps = [
  {
    number: 1,
    title: "Enable Delegation",
    description:
      "User approves delegation, creating a secure key share stored server-side.",
    icon: Key,
    bgClass: "bg-dynamic/10",
  },
  {
    number: 2,
    title: "Server Access",
    description:
      "Your backend can now sign transactions on behalf of the user securely.",
    icon: Server,
    bgClass: "bg-dynamic/15",
  },
  {
    number: 3,
    title: "User Control",
    description:
      "Users can revoke delegation at any time, maintaining full custody.",
    icon: ShieldCheck,
    bgClass: "bg-dynamic/20",
  },
];

export default function DelegationSteps() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {steps.map((step) => (
        <div
          key={step.number}
          className="rounded-xl border border-dynamic/20 bg-card p-4 space-y-2 transition-all hover:shadow-md"
        >
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${step.bgClass}`}
          >
            <step.icon className="w-5 h-5 text-dynamic" />
          </div>
          <h3 className="font-semibold text-sm">
            {step.number}. {step.title}
          </h3>
          <p className="text-xs text-muted-foreground">{step.description}</p>
        </div>
      ))}
    </div>
  );
}
