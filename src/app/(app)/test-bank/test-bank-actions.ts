"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/database.types";

export type ActionResult = { error: string } | { ok: true };

// A test-bank entry is just a link out (Google Drive, soinc.org, …), optionally
// tagged to an event so it groups under that event on the page.
export async function addLink(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();

  const division = String(
    formData.get("division") ?? ""
  ) as Enums<"division_code">;
  const eventId = String(formData.get("event_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const source = String(formData.get("source") ?? "").trim();

  if (division !== "B" && division !== "C") return { error: "Pick a division." };
  if (!title || !url) return { error: "Title and URL are required." };
  if (!/^https?:\/\//i.test(url)) {
    return { error: "URL must start with http:// or https://" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("test_bank_links").insert({
    division,
    event_id: eventId || null,
    title,
    url,
    source,
    added_by: user.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/test-bank");
  return { ok: true };
}

export async function deleteLink(linkId: string): Promise<ActionResult> {
  await requireUser();

  const supabase = await createClient();
  const { error } = await supabase
    .from("test_bank_links")
    .delete()
    .eq("id", linkId);
  if (error) return { error: error.message };

  revalidatePath("/test-bank");
  return { ok: true };
}
