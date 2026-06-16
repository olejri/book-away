import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { SettingsForm } from "../_components/SettingsForm";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const settings = await api.settings.getTrelloEmail();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-foreground/60">
          Manage your Trello board email
        </p>
      </div>

      <SettingsForm currentEmail={settings?.trelloEmail ?? null} />
    </div>
  );
}

