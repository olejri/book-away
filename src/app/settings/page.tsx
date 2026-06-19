import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { SettingsForm } from "../_components/SettingsForm";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-foreground/60">
          Manage your Trello board emails
        </p>
      </div>

      <SettingsForm />
    </div>
  );
}
