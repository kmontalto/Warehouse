import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const hashedPassword = await bcrypt.hash("warehouse10u", 10);
  const admin = await prisma.user.upsert({
    where: { email: "coach@warehouse10u.com" },
    update: {},
    create: {
      email: "coach@warehouse10u.com",
      password: hashedPassword,
      name: "Coach Admin",
      role: "admin",
    },
  });
  console.log("Created admin user:", admin.email);

  // Create players (10U roster)
  const players = await Promise.all(
    [
      { firstName: "Jake", lastName: "Martinez", jerseyNumber: 1, positions: "SS,2B" },
      { firstName: "Ryan", lastName: "Thompson", jerseyNumber: 4, positions: "P,1B" },
      { firstName: "Lucas", lastName: "Williams", jerseyNumber: 7, positions: "CF,LF" },
      { firstName: "Ethan", lastName: "Davis", jerseyNumber: 11, positions: "C,3B" },
      { firstName: "Mason", lastName: "Johnson", jerseyNumber: 14, positions: "2B,SS" },
      { firstName: "Noah", lastName: "Anderson", jerseyNumber: 17, positions: "RF,CF" },
      { firstName: "Liam", lastName: "Garcia", jerseyNumber: 21, positions: "1B,P" },
      { firstName: "Aiden", lastName: "Brown", jerseyNumber: 24, positions: "3B,C" },
      { firstName: "Carter", lastName: "Wilson", jerseyNumber: 27, positions: "LF,RF" },
      { firstName: "Owen", lastName: "Taylor", jerseyNumber: 30, positions: "P,2B" },
      { firstName: "Dylan", lastName: "Moore", jerseyNumber: 33, positions: "CF,SS" },
      { firstName: "Caleb", lastName: "Jackson", jerseyNumber: 36, positions: "C,1B" },
    ].map((p) =>
      prisma.player.create({ data: p })
    )
  );
  console.log(`Created ${players.length} players`);

  // Create upcoming events
  const now = new Date();
  const events = await Promise.all([
    prisma.event.create({
      data: {
        type: "practice",
        title: "Team Practice",
        date: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
        time: "5:30 PM",
        location: "Warehouse Training Facility",
        fieldName: "Field 1",
        notes: "Focus on hitting and base running",
      },
    }),
    prisma.event.create({
      data: {
        type: "game",
        title: "vs Diamond Dogs",
        date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        time: "6:00 PM",
        location: "Central Park Complex",
        fieldName: "Field A",
        opponent: "Diamond Dogs",
        homeAway: "home",
        notes: "Arrive by 5:15 PM for warmups",
      },
    }),
    prisma.event.create({
      data: {
        type: "game",
        title: "vs Thunder Bolts",
        date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        time: "10:00 AM",
        location: "Riverside Fields",
        fieldName: "Field 3",
        opponent: "Thunder Bolts",
        homeAway: "away",
        notes: "Tournament game - pool play",
      },
    }),
    prisma.event.create({
      data: {
        type: "tournament",
        title: "Spring Showdown Tournament",
        date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        time: "8:00 AM",
        location: "Grand Slam Sports Complex",
        fieldName: "Fields 1-4",
        notes: "Full day tournament. Pack lunches and extra water.",
      },
    }),
    prisma.event.create({
      data: {
        type: "practice",
        title: "Pitching Clinic",
        date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        time: "4:00 PM",
        location: "Warehouse Training Facility",
        fieldName: "Indoor Cage",
        notes: "Pitchers and catchers focus",
      },
    }),
    // Past games with results
    prisma.event.create({
      data: {
        type: "game",
        title: "vs Aces",
        date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        time: "6:00 PM",
        location: "Home Field",
        fieldName: "Field 1",
        opponent: "Aces",
        homeAway: "home",
        result: "W 8-3",
      },
    }),
    prisma.event.create({
      data: {
        type: "game",
        title: "vs Sluggers",
        date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        time: "5:00 PM",
        location: "West Side Park",
        fieldName: "Field B",
        opponent: "Sluggers",
        homeAway: "away",
        result: "W 5-2",
      },
    }),
    prisma.event.create({
      data: {
        type: "game",
        title: "vs Vipers",
        date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        time: "11:00 AM",
        location: "Tournament Complex",
        fieldName: "Field 2",
        opponent: "Vipers",
        homeAway: "away",
        result: "L 2-6",
      },
    }),
  ]);
  console.log(`Created ${events.length} events`);

  // Player of the Game for past games
  const pastGames = events.filter((e) => e.result);
  if (pastGames.length > 0) {
    await prisma.playerOfTheGame.create({
      data: {
        playerId: players[0].id,
        eventId: pastGames[0].id,
        reason: "3-for-3 with 2 RBIs and a great play at short",
      },
    });
    await prisma.playerOfTheGame.create({
      data: {
        playerId: players[1].id,
        eventId: pastGames[1].id,
        reason: "4 innings pitched, 1 hit, 6 strikeouts",
      },
    });
    await prisma.playerOfTheGame.create({
      data: {
        playerId: players[3].id,
        eventId: pastGames[2].id,
        reason: "Great defensive effort behind the plate",
      },
    });
  }
  console.log("Created Player of the Game entries");

  // Create drills
  const drills = await Promise.all([
    prisma.drill.create({
      data: {
        name: "Tee Work",
        duration: 15,
        skillFocus: "Hitting",
        description: "Players rotate through tees focusing on level swing path and contact point.",
      },
    }),
    prisma.drill.create({
      data: {
        name: "Soft Toss",
        duration: 15,
        skillFocus: "Hitting",
        description: "Partner soft toss from the side. Focus on timing and bat path.",
      },
    }),
    prisma.drill.create({
      data: {
        name: "Ground Ball Stations",
        duration: 20,
        skillFocus: "Fielding",
        description: "3 stations: forehand, backhand, and slow rollers. Coaches hit from home plate.",
      },
    }),
    prisma.drill.create({
      data: {
        name: "Fly Ball Communication",
        duration: 15,
        skillFocus: "Fielding",
        description: "Outfielders practice calling off other players. Coach hits pop flies between positions.",
      },
    }),
    prisma.drill.create({
      data: {
        name: "Pitching Mechanics",
        duration: 20,
        skillFocus: "Pitching",
        description: "Towel drill, balance point holds, and flat-ground work focusing on mechanics.",
      },
    }),
    prisma.drill.create({
      data: {
        name: "Base Running 101",
        duration: 15,
        skillFocus: "Baserunning",
        description: "Home to 1st sprints, rounding bases, reading the ball off the bat.",
      },
    }),
    prisma.drill.create({
      data: {
        name: "Relay Throws",
        duration: 15,
        skillFocus: "Fielding",
        description: "Full relay drill: outfield to cutoff to base. Practice positioning and accuracy.",
      },
    }),
    prisma.drill.create({
      data: {
        name: "Situational Hitting",
        duration: 20,
        skillFocus: "Hitting",
        description: "Coach calls situation before each at-bat. Move runner, sacrifice, hit-and-run.",
      },
    }),
    prisma.drill.create({
      data: {
        name: "Warm-Up / Dynamic Stretching",
        duration: 10,
        skillFocus: "Conditioning",
        description: "Jog, high knees, butt kicks, arm circles, band work.",
      },
    }),
    prisma.drill.create({
      data: {
        name: "Catcher Pop-Up Drill",
        duration: 15,
        skillFocus: "Fielding",
        description: "Catchers practice removing mask and tracking pop-ups behind home plate.",
      },
    }),
  ]);
  console.log(`Created ${drills.length} drills`);

  // Create a sample practice plan
  const practicePlan = await prisma.practicePlan.create({
    data: {
      date: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      title: "Pre-Game Practice",
      focus: "General",
      notes: "Light practice before Thursday's game. Keep energy high.",
    },
  });

  await Promise.all([
    prisma.practicePlanDrill.create({
      data: { practicePlanId: practicePlan.id, drillId: drills[8].id, order: 1 },
    }),
    prisma.practicePlanDrill.create({
      data: { practicePlanId: practicePlan.id, drillId: drills[0].id, order: 2 },
    }),
    prisma.practicePlanDrill.create({
      data: { practicePlanId: practicePlan.id, drillId: drills[2].id, order: 3 },
    }),
    prisma.practicePlanDrill.create({
      data: { practicePlanId: practicePlan.id, drillId: drills[5].id, order: 4 },
    }),
  ]);
  console.log("Created sample practice plan with drills");

  // Create message templates
  await Promise.all([
    prisma.messageTemplate.create({
      data: {
        type: "game_reminder",
        name: "Game Day Reminder",
        subject: "Game Reminder - Warehouse 10U",
        body: `Hi Warehouse families! 🏟️

Just a reminder that we have a game coming up:

📅 Date: {{date}}
⏰ Time: {{time}} (please arrive 30 min early)
📍 Location: {{location}} - {{field}}
🆚 Opponent: {{opponent}}

Please confirm your player's attendance. Let's go Warehouse! ⚾`,
      },
    }),
    prisma.messageTemplate.create({
      data: {
        type: "weather_change",
        name: "Weather Delay/Cancel",
        subject: "Weather Update - Warehouse 10U",
        body: `Hi Warehouse families,

Due to weather conditions, we need to update you on our schedule:

📅 Original Date: {{date}}
⏰ Original Time: {{time}}
📍 Location: {{location}}

⚠️ Status: {{status}}

{{details}}

We'll keep you posted on any further changes. Stay dry! 🌧️`,
      },
    }),
    prisma.messageTemplate.create({
      data: {
        type: "schedule_update",
        name: "Schedule Change",
        subject: "Schedule Update - Warehouse 10U",
        body: `Hi Warehouse families,

We have a schedule change to share:

{{details}}

Please update your calendars. Reach out if you have any questions!

- Warehouse Coaching Staff`,
      },
    }),
    prisma.messageTemplate.create({
      data: {
        type: "general",
        name: "Practice Reminder",
        subject: "Practice Reminder - Warehouse 10U",
        body: `Hi Warehouse families!

Reminder that we have practice:

📅 Date: {{date}}
⏰ Time: {{time}}
📍 Location: {{location}} - {{field}}

Focus: {{focus}}

Please bring water and arrive a few minutes early. See you there!

- Warehouse Coaching Staff`,
      },
    }),
  ]);
  console.log("Created message templates");

  console.log("\nSeed complete!");
  console.log("Login credentials: coach@warehouse10u.com / warehouse10u");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
