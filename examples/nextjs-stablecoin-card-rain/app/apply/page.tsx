import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageLayout } from "@/components/ui/page-layout";
import ApplicationForm from "@/components/application/application-form";

export default function ApplyPage() {
  return (
    <PageLayout>
      <Card>
        <CardHeader>
          <CardTitle>KYC Application - Demo</CardTitle>
          <CardDescription>
            This is a the demo of the Know Your Customer (KYC) verification
            process. Prefill with sample data or use sample data for testing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApplicationForm formId="apply-form" />
        </CardContent>
      </Card>
    </PageLayout>
  );
}
