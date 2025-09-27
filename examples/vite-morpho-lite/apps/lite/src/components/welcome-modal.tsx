import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@morpho-org/uikit/components/shadcn/alert-dialog";
import { useLocalStorage } from "@morpho-org/uikit/hooks/use-local-storage";

import { TERMS_OF_USE } from "@/lib/constants";

export function WelcomeModal() {
  const [hasSeenWelcome, setHasSeenWelcome] = useLocalStorage<boolean>("hasSeenWelcome", false);

  const onClose = () => {
    setHasSeenWelcome(true);
  };

  return (
    <AlertDialog open={!hasSeenWelcome}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="mb-3 text-2xl font-light">Welcome!</AlertDialogTitle>
          <AlertDialogDescription className="bg-secondary text-secondary-foreground rounded-lg p-4 font-light">
            You are using Morpho Lite.
            <br />
            <br />
            This streamlined app gives you access to core features—supply in vaults and borrow from markets—but excludes
            some main‑app features, data, and content. Learn more{" "}
            <a
              className="underline"
              href="https://morpho.org/blog/introducing-morpho-lite/"
              rel="noopener noreferrer"
              target="_blank"
            >
              here
            </a>
            .
            <br />
            <br />
            By continuing, you agree to Morpho's{" "}
            <a className="underline" href={TERMS_OF_USE} rel="noopener noreferrer" target="_blank">
              Terms of Use
            </a>
            .
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction className="w-full rounded-full" onClick={onClose}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
