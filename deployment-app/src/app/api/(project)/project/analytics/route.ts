import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { client } from "@/lib/clickhouse";

// Define interfaces for the ClickHouse response data
interface DailyVisit {
  total_visits: string; // ClickHouse returns numbers as strings
  date: string;
}

// interface HourlyVisit {
//   hour: number;
//   visits: string;
// }

export async function GET(req: NextRequest) {
  try {
    const subDomain = req.nextUrl.searchParams.get("subdomain");
    if (!subDomain) {
      return NextResponse.json(
        { error: "Subdomain is required" },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: {
        subDomain,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get daily visits from ClickHouse
    const result = await client.query({
      query: `
        SELECT 
          COUNT(*) as total_visits,
          toDate(timestamp) as date
        FROM page_events
        WHERE page_url LIKE '%${project.subDomain}%'
        GROUP BY date
        ORDER BY date DESC
      `,
      format: "JSONEachRow",
    });
    const visits = (await result.json()) as DailyVisit[];

    // Calculate total visits
    const totalVisits = visits.reduce(
      (sum: number, day) => sum + Number(day.total_visits),
      0
    );

    // // Get hourly distribution for last 30 days
    // const hourlyStats = await client.query({
    //   query: `
    //     SELECT
    //       toHour(timestamp) as hour,
    //       COUNT(*) as visits
    //     FROM page_events
    //     WHERE
    //       page_url LIKE '%${project.subDomain}%'
    //       AND timestamp >= now() - INTERVAL 30 DAY
    //     GROUP BY hour
    //     ORDER BY hour
    //   `,
    //   format: "JSONEachRow",
    // });
    // const hourlyVisits = (await hourlyStats.json()) as HourlyVisit[];

    return NextResponse.json({
      projectUrl: project.subDomain,
      totalVisits,
      dailyVisits: visits,
      // hourlyDistribution: hourlyVisits,
      metadata: {
        startDate: visits.length > 0 ? visits[visits.length - 1].date : null,
        endDate: visits.length > 0 ? visits[0].date : null,
      },
    });
  } catch (error) {
    console.error("Error fetching visits:", error);
    return NextResponse.json(
      { error: "Failed to fetch visit statistics" },
      { status: 500 }
    );
  }
}
