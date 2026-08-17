const { scheduleTripReminder } = require("./reminder.job");

async function test() {
  const job1 = await scheduleTripReminder("TEST-123", 10000);
  const job2 = await scheduleTripReminder("TEST-122", 10000);

  console.log("Job 1:", job1.id);
  console.log("Job 2:", job2.id);
}

test().catch((error) => {
  console.error("Failed:", error);
});