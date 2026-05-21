import { readRecentEvents } from "./zeusControlPlane";

const events = readRecentEvents(20);
console.log(`Total events: ${events.length}`);
console.log("");

events.forEach((e) => {
  console.log(`[${e.at}] ${e.source}: ${e.type}`);
  console.log(`  Summary: ${e.summary}`);
});
