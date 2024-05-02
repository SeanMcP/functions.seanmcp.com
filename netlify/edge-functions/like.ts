// @ts-expect-error
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Netlify.env.get("SUPABASE_LIKES_URL"),
  Netlify.env.get("SUPABASE_LIKES_KEY")
);

const headers = {
  "access-control-allow-origin": "*",
};

export default async (req: Request) => {
  const requestURL = new URL(req.url);
  let slug = requestURL.searchParams.get("slug");

  if (!slug) {
    return Response.json({ error: "Missing slug" }, { headers, status: 400 });
  }

  slug = normalizeSlug(slug);

  try {
    const exists = await supabase
      .from("likes")
      .select("slug,count")
      .eq("slug", slug)
      .single();

    if (exists.data) {
      const next = exists.data.count + 1;
      const update = await supabase
        .from("likes")
        .update({ count: next, last_updated: new Date().toISOString() })
        .eq("slug", slug);

      if (update.error) {
        throw update.error;
      }

      return Response.json({ count: next }, { headers, status: 200 });
    } else {
      const create = await supabase.from("likes").insert({ slug });

      if (create.error) {
        throw create.error;
      }

      return Response.json({ count: 1 }, { headers, status: 200 });
    }
  } catch (error) {
    return Response.json({ error }, { headers, status: 500 });
  }
};

export const config = {
  path: "/api/like",
};

// Shared with netlify/edge-functions/likes.ts
function normalizeSlug(slug: string): string {
  if (!slug) return slug;

  // Force trailing slash
  return slug.slice(-1) === "/" ? slug : `${slug}/`;
}
