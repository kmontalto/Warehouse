import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

interface GCEvent {
  type: "game" | "practice" | "tournament";
  title: string;
  date: string; // ISO date
  time: string;
  location: string;
  fieldName: string | null;
  opponent: string | null;
  homeAway: string | null;
  result: string | null;
}

/** Extract the team ID from a GameChanger URL */
function parseGCUrl(url: string): { teamId: string; seasonSlug: string } | null {
  // https://web.gc.com/teams/{teamId}/{seasonSlug}/schedule
  const match = url.match(
    /web\.gc\.com\/teams\/([^/]+)\/([^/]+)/
  );
  if (!match) return null;
  return { teamId: match[1], seasonSlug: match[2] };
}

/** Try to extract schedule JSON from embedded script tags in page HTML */
function extractEmbeddedData(html: string): unknown | null {
  // Strategy 1: __NEXT_DATA__ (Next.js SSR)
  const nextDataMatch = html.match(
    /<script\s+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/
  );
  if (nextDataMatch) {
    try {
      return JSON.parse(nextDataMatch[1]);
    } catch { /* continue */ }
  }

  // Strategy 2: Look for any script tag containing schedule-like JSON arrays
  const scriptTags = html.matchAll(
    /<script[^>]*>([\s\S]*?)<\/script>/g
  );
  for (const match of scriptTags) {
    const content = match[1];
    // Look for JSON objects with schedule/event-like keys
    if (
      content.includes('"schedule"') ||
      content.includes('"events"') ||
      content.includes('"games"')
    ) {
      // Try to extract JSON from assignments like window.__data__ = {...}
      const jsonMatch = content.match(/=\s*(\{[\s\S]*\})\s*;?\s*$/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1]);
        } catch { /* continue */ }
      }
    }
  }

  return null;
}

/**
 * Recursively search an object for arrays that look like schedule events.
 * Returns the first array where items have date-like and opponent/title-like fields.
 */
function findEventArray(obj: unknown, depth = 0): Record<string, unknown>[] | null {
  if (depth > 10) return null;
  if (Array.isArray(obj)) {
    if (
      obj.length > 0 &&
      typeof obj[0] === "object" &&
      obj[0] !== null
    ) {
      const first = obj[0] as Record<string, unknown>;
      const keys = Object.keys(first).map((k) => k.toLowerCase());
      const hasDate = keys.some((k) =>
        ["date", "start", "startdate", "start_date", "datetime", "scheduleddate"].includes(k)
      );
      const hasEventInfo = keys.some((k) =>
        ["opponent", "title", "name", "type", "eventtype", "event_type", "label", "opponentname"].includes(k)
      );
      if (hasDate && (hasEventInfo || obj.length >= 3)) {
        return obj as Record<string, unknown>[];
      }
    }
  }
  if (typeof obj === "object" && obj !== null) {
    for (const value of Object.values(obj as Record<string, unknown>)) {
      const result = findEventArray(value, depth + 1);
      if (result) return result;
    }
  }
  return null;
}

/** Parse time from various formats into "h:mm AM/PM" */
function normalizeTime(raw: unknown): string {
  if (!raw) return "TBD";
  const str = String(raw);

  // Already in "h:mm PM" format
  if (/\d{1,2}:\d{2}\s*(AM|PM)/i.test(str)) {
    return str.trim();
  }

  // ISO datetime — extract time portion
  const isoMatch = str.match(/T(\d{2}):(\d{2})/);
  if (isoMatch) {
    let h = parseInt(isoMatch[1]);
    const m = isoMatch[2];
    const ampm = h >= 12 ? "PM" : "AM";
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${h}:${m} ${ampm}`;
  }

  // 24-hour "HH:MM"
  const h24 = str.match(/^(\d{1,2}):(\d{2})$/);
  if (h24) {
    let h = parseInt(h24[1]);
    const m = h24[2];
    const ampm = h >= 12 ? "PM" : "AM";
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${h}:${m} ${ampm}`;
  }

  return str.trim() || "TBD";
}

/** Try to map a raw GC event object to our Event shape */
function mapGCEvent(raw: Record<string, unknown>): GCEvent | null {
  // Find the date field
  const dateKey = Object.keys(raw).find((k) =>
    ["date", "start", "startdate", "start_date", "datetime", "scheduleddate"].includes(
      k.toLowerCase()
    )
  );
  if (!dateKey || !raw[dateKey]) return null;

  const dateStr = String(raw[dateKey]);
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;

  // Find time
  const timeKey = Object.keys(raw).find((k) =>
    ["time", "starttime", "start_time"].includes(k.toLowerCase())
  );
  const time = timeKey ? normalizeTime(raw[timeKey]) : normalizeTime(dateStr);

  // Determine event type
  const typeKey = Object.keys(raw).find((k) =>
    ["type", "eventtype", "event_type", "category"].includes(k.toLowerCase())
  );
  let type: "game" | "practice" | "tournament" = "game";
  if (typeKey) {
    const t = String(raw[typeKey]).toLowerCase();
    if (t.includes("practice") || t.includes("training")) type = "practice";
    else if (t.includes("tournament") || t.includes("tourney")) type = "tournament";
  }

  // Find opponent
  const oppKey = Object.keys(raw).find((k) =>
    ["opponent", "opponentname", "opponent_name", "opposingteam", "opposing_team"].includes(
      k.toLowerCase()
    )
  );
  const opponent = oppKey ? String(raw[oppKey] || "").trim() || null : null;

  // Find title
  const titleKey = Object.keys(raw).find((k) =>
    ["title", "name", "label", "description"].includes(k.toLowerCase())
  );
  let title = titleKey ? String(raw[titleKey] || "").trim() : "";
  if (!title && opponent) title = `vs ${opponent}`;
  if (!title) title = type.charAt(0).toUpperCase() + type.slice(1);

  // Find location
  const locKey = Object.keys(raw).find((k) =>
    ["location", "venue", "facility", "locationname", "location_name", "venuename"].includes(
      k.toLowerCase()
    )
  );
  const location = locKey ? String(raw[locKey] || "").trim() || "TBD" : "TBD";

  // Find field name
  const fieldKey = Object.keys(raw).find((k) =>
    ["field", "fieldname", "field_name", "diamond", "court"].includes(k.toLowerCase())
  );
  const fieldName = fieldKey ? String(raw[fieldKey] || "").trim() || null : null;

  // Find home/away
  const haKey = Object.keys(raw).find((k) =>
    ["homeaway", "home_away", "homeoraway", "ishome", "is_home"].includes(k.toLowerCase())
  );
  let homeAway: string | null = null;
  if (haKey) {
    const ha = String(raw[haKey]).toLowerCase();
    if (ha === "true" || ha === "home" || ha === "1") homeAway = "home";
    else if (ha === "false" || ha === "away" || ha === "0") homeAway = "away";
    else homeAway = ha;
  }

  // Find result/score
  const resultKey = Object.keys(raw).find((k) =>
    ["result", "score", "finalscore", "final_score", "outcome"].includes(k.toLowerCase())
  );
  let result: string | null = null;
  if (resultKey && raw[resultKey]) {
    result = String(raw[resultKey]).trim() || null;
  }
  // Check for separate score fields
  if (!result) {
    const homeScoreKey = Object.keys(raw).find((k) =>
      ["homescore", "home_score", "teamscore", "team_score", "ourscore"].includes(k.toLowerCase())
    );
    const awayScoreKey = Object.keys(raw).find((k) =>
      ["awayscore", "away_score", "opponentscore", "opponent_score", "theirscore"].includes(
        k.toLowerCase()
      )
    );
    if (homeScoreKey && awayScoreKey && raw[homeScoreKey] != null && raw[awayScoreKey] != null) {
      const ours = Number(raw[homeScoreKey]);
      const theirs = Number(raw[awayScoreKey]);
      if (!isNaN(ours) && !isNaN(theirs)) {
        const prefix = ours > theirs ? "W" : ours < theirs ? "L" : "T";
        result = `${prefix} ${ours}-${theirs}`;
      }
    }
  }

  return {
    type,
    title,
    date: date.toISOString(),
    time,
    location,
    fieldName,
    opponent,
    homeAway,
    result,
  };
}

/** Parse schedule data from HTML structure as a last resort */
function parseHTMLSchedule(html: string): GCEvent[] {
  const events: GCEvent[] = [];

  // Look for common HTML patterns for event cards/rows
  // GameChanger often renders event items with data attributes or structured divs
  const eventBlocks = html.matchAll(
    /data-(?:event|game|schedule)[^>]*>[\s\S]*?<\/(?:div|li|tr)>/gi
  );

  for (const block of eventBlocks) {
    const content = block[0];

    // Try to extract date
    const dateMatch = content.match(
      /(\d{1,2}\/\d{1,2}\/\d{2,4})|(\w{3}\s+\d{1,2},?\s*\d{4})|(\d{4}-\d{2}-\d{2})/
    );
    if (!dateMatch) continue;

    const date = new Date(dateMatch[0]);
    if (isNaN(date.getTime())) continue;

    // Try to extract time
    const timeMatch = content.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
    const time = timeMatch ? timeMatch[1] : "TBD";

    // Try to extract opponent from "vs" or "at" patterns
    const vsMatch = content.match(/(?:vs\.?|versus|at)\s+([^<]+)/i);
    const opponent = vsMatch ? vsMatch[1].trim() : null;

    events.push({
      type: "game",
      title: opponent ? `vs ${opponent}` : "Game",
      date: date.toISOString(),
      time,
      location: "TBD",
      fieldName: null,
      opponent,
      homeAway: null,
      result: null,
    });
  }

  return events;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { url, debug } = body as { url: string; debug?: boolean };

    if (!url) {
      return NextResponse.json(
        { error: "Missing required field: url (GameChanger schedule URL)" },
        { status: 400 }
      );
    }

    const parsed = parseGCUrl(url);
    if (!parsed) {
      return NextResponse.json(
        {
          error:
            "Invalid GameChanger URL. Expected format: https://web.gc.com/teams/{teamId}/{season}/schedule",
        },
        { status: 400 }
      );
    }

    // Try multiple strategies to get schedule data
    let gcEvents: GCEvent[] = [];
    const diagnostics: string[] = [];

    // Strategy 1: Fetch the schedule page HTML
    try {
      diagnostics.push("Fetching schedule page...");
      const pageRes = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      if (pageRes.ok) {
        const html = await pageRes.text();
        diagnostics.push(`Got HTML page (${html.length} chars)`);

        // Try embedded JSON data
        const embedded = extractEmbeddedData(html);
        if (embedded) {
          diagnostics.push("Found embedded data in page");
          const eventArr = findEventArray(embedded);
          if (eventArr) {
            diagnostics.push(`Found event array with ${eventArr.length} items`);
            gcEvents = eventArr
              .map(mapGCEvent)
              .filter((e): e is GCEvent => e !== null);
            diagnostics.push(`Mapped ${gcEvents.length} events from embedded data`);
          } else {
            diagnostics.push("Could not find event array in embedded data");
            if (debug) {
              return NextResponse.json({
                diagnostics,
                embeddedDataKeys:
                  typeof embedded === "object" && embedded !== null
                    ? Object.keys(embedded as Record<string, unknown>)
                    : typeof embedded,
                htmlSnippet: html.substring(0, 3000),
              });
            }
          }
        } else {
          diagnostics.push("No embedded JSON data found in HTML");
        }

        // Fallback: parse HTML structure
        if (gcEvents.length === 0) {
          const htmlEvents = parseHTMLSchedule(html);
          if (htmlEvents.length > 0) {
            gcEvents = htmlEvents;
            diagnostics.push(
              `Parsed ${htmlEvents.length} events from HTML structure`
            );
          } else {
            diagnostics.push("Could not parse events from HTML structure");
          }
        }

        if (gcEvents.length === 0 && debug) {
          return NextResponse.json({
            diagnostics,
            htmlSnippet: html.substring(0, 5000),
          });
        }
      } else {
        diagnostics.push(`Page fetch failed with status ${pageRes.status}`);
      }
    } catch (err) {
      diagnostics.push(
        `Page fetch error: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    // Strategy 2: Try known API patterns
    if (gcEvents.length === 0) {
      const apiUrls = [
        `https://web.gc.com/api/teams/${parsed.teamId}/schedule`,
        `https://web.gc.com/api/teams/${parsed.teamId}/events`,
        `https://api.gc.com/teams/${parsed.teamId}/schedule`,
        `https://web.gc.com/api/teams/${parsed.teamId}/${parsed.seasonSlug}/schedule`,
      ];

      for (const apiUrl of apiUrls) {
        try {
          diagnostics.push(`Trying API: ${apiUrl}`);
          const apiRes = await fetch(apiUrl, {
            headers: {
              Accept: "application/json",
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
          });
          if (apiRes.ok) {
            const contentType = apiRes.headers.get("content-type") || "";
            if (contentType.includes("json")) {
              const data = await apiRes.json();
              diagnostics.push(`Got JSON from ${apiUrl}`);
              const eventArr = findEventArray(data);
              if (eventArr) {
                gcEvents = eventArr
                  .map(mapGCEvent)
                  .filter((e): e is GCEvent => e !== null);
                diagnostics.push(`Mapped ${gcEvents.length} events from API`);
                break;
              } else if (Array.isArray(data)) {
                gcEvents = (data as Record<string, unknown>[])
                  .map(mapGCEvent)
                  .filter((e): e is GCEvent => e !== null);
                if (gcEvents.length > 0) {
                  diagnostics.push(`Mapped ${gcEvents.length} events from API array`);
                  break;
                }
              }
              if (debug) {
                return NextResponse.json({
                  diagnostics,
                  apiData: data,
                });
              }
            } else {
              diagnostics.push(`Non-JSON response from ${apiUrl}: ${contentType}`);
            }
          } else {
            diagnostics.push(`API ${apiUrl} returned ${apiRes.status}`);
          }
        } catch (err) {
          diagnostics.push(
            `API error: ${err instanceof Error ? err.message : String(err)}`
          );
        }
      }
    }

    if (gcEvents.length === 0) {
      return NextResponse.json(
        {
          error:
            "Could not extract schedule data from GameChanger. Try running with debug=true for diagnostics.",
          diagnostics,
        },
        { status: 422 }
      );
    }

    // Sync events to database
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const gcEvent of gcEvents) {
      const eventDate = new Date(gcEvent.date);
      // Normalize date to start of day for matching
      const dayStart = new Date(eventDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      // Find existing event matching date + opponent (for games) or date + title
      const existing = await prisma.event.findFirst({
        where: {
          date: { gte: dayStart, lt: dayEnd },
          ...(gcEvent.opponent
            ? { opponent: gcEvent.opponent }
            : { title: gcEvent.title }),
        },
      });

      if (existing) {
        // Update if any fields changed
        const changes: Record<string, unknown> = {};
        if (gcEvent.time !== existing.time) changes.time = gcEvent.time;
        if (gcEvent.location !== existing.location && gcEvent.location !== "TBD")
          changes.location = gcEvent.location;
        if (gcEvent.fieldName && gcEvent.fieldName !== existing.fieldName)
          changes.fieldName = gcEvent.fieldName;
        if (gcEvent.homeAway && gcEvent.homeAway !== existing.homeAway)
          changes.homeAway = gcEvent.homeAway;
        if (gcEvent.result && gcEvent.result !== existing.result)
          changes.result = gcEvent.result;

        if (Object.keys(changes).length > 0) {
          await prisma.event.update({
            where: { id: existing.id },
            data: changes,
          });
          updated++;
        } else {
          skipped++;
        }
      } else {
        await prisma.event.create({
          data: {
            type: gcEvent.type,
            title: gcEvent.title,
            date: eventDate,
            time: gcEvent.time,
            location: gcEvent.location,
            fieldName: gcEvent.fieldName,
            opponent: gcEvent.opponent,
            homeAway: gcEvent.homeAway,
            result: gcEvent.result,
          },
        });
        created++;
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: gcEvents.length,
        created,
        updated,
        skipped,
      },
      diagnostics,
    });
  } catch (error) {
    console.error("GameChanger sync error:", error);
    return NextResponse.json(
      { error: "Sync failed: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
