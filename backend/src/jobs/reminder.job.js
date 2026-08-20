const reminderQueue = require("../queues/reminder.queue");

function withRedisTimeout(operation, label) {
  return Promise.race([
    operation,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timed out. Is Redis running?`)),
        1500
      )
    ),
  ]);
}

//JOB ID
function getReminderJobId(tripId) {
  return `trip-reminder-${tripId}`;
}


//Schedulingggg
async function scheduleTripReminder(tripId, delay) {
  const jobId =getReminderJobId(tripId);

  const job = await withRedisTimeout(
    reminderQueue.add(
      "trip-start-reminder",
      {
        tripId,
      },
      {
        jobId,
        delay,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
      }
    ),
    "Reminder scheduling"
  );

  console.log(`Reminder job scheduled: ${job.id}`);

  return job;
}

//cancel 
async function cancelTripReminder(tripId) {
  const jobId = getReminderJobId(tripId);

  const job = await withRedisTimeout(
    reminderQueue.getJob(jobId),
    "Reminder lookup"
  );

  if (!job) {
    console.log(`No reminder job found for trip ${tripId}`);
    return false;
  }

  await job.remove();

  console.log(`Reminder job removed: ${jobId}`);

  return true;
}

//reschdule
async function rescheduleTripReminder(tripId, newDelay) {
  await cancelTripReminder(tripId);

  return scheduleTripReminder(tripId, newDelay);
}

module.exports = {
  getReminderJobId,
  scheduleTripReminder,
  cancelTripReminder,
  rescheduleTripReminder,
};
