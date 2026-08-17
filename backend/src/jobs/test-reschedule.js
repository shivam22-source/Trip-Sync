const {
  scheduleTripReminder,
  rescheduleTripReminder,
} = require("./reminder.job");

async function test() {
  console.log("Creating original reminder...");

  await scheduleTripReminder("TEST-456", 20000);

  console.log("Original reminder scheduled for 20 seconds.");

  setTimeout(async () => {
    console.log("Changing reminder...");

    await rescheduleTripReminder("TEST-456", 5000);

    console.log("Reminder rescheduled to 5 seconds.");
  }, 5000);
}

test().catch((error) => {
  console.error("Reschedule test failed:", error);
});