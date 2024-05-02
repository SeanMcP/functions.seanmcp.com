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
  slug = normalizeSlug(slug || "");

  try {
    if (slug) {
      // Return count for a specific slug
      const exists = await supabase
        .from("likes")
        .select("slug,count")
        .eq("slug", slug)
        .single();

      if (exists.data) {
        return Response.json(
          { count: exists.data.count },
          { headers, status: 200 }
        );
      } else {
        return Response.json({ count: 0 }, { headers, status: 200 });
      }
    }
    // Return all slugs and counts
    const ordered = await supabase
      .from("likes")
      .select("slug,count,last_updated")
      .order("count", { ascending: false });

    if (ordered.error) {
      throw ordered.error;
    }

    return Response.json({ data: ordered.data }, { headers, status: 200 });
  } catch (error) {
    return Response.json({ error }, { headers, status: 500 });
  }
};

export const config = {
  path: "/api/likes",
};

// Shared with netlify/edge-functions/like.ts
function normalizeSlug(slug: string): string {
  if (!slug) return slug;

  // Force trailing slash
  return slug.slice(-1) === "/" ? slug : `${slug}/`;
}
