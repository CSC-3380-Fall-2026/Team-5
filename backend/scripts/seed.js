
const fs = require("node:fs");
const path = require("node:path");

const outputDirectory = path.join(__dirname, "..", "data");
const outputFile = path.join(outputDirectory, "seed-data.json");

function generateSampleData() {
  const users = [
    {
      id: 1,
      name: "Alice Johnson",
      email: "alice.seed@example.test",
      bio: "Saving memories for the future.",
    },
    {
      id: 2,
      name: "Bob Smith",
      email: "bob.seed@example.test",
      bio: "Making memories with friends.",
    },
    {
      id: 3,
      name: "Charlie Davis",
      email: "charlie.seed@example.test",
      bio: "Looking forward to opening our capsules.",
    },
  ];

  const groups = [
    { id: 1, name: "Junior Year", createdBy: 1 },
    { id: 2, name: "Summer Adventures", createdBy: 2 },
  ];

  const memberships = [
    { groupId: 1, userId: 1 },
    { groupId: 1, userId: 2 },
    { groupId: 1, userId: 3 },
    { groupId: 2, userId: 2 },
    { groupId: 2, userId: 3 },
  ];

  const capsules = [
    {
      id: 1,
      groupId: 1,
      createdBy: 1,
      title: "Junior Year Memories",
      description: "Photos and notes from junior year.",
      opensAt: "2030-06-01T12:00:00",
    },
    {
      id: 2,
      groupId: 2,
      createdBy: 2,
      title: "Summer Adventures",
      description: "Our favorite summer moments.",
      opensAt: "2030-09-01T12:00:00",
    },
  ];

  const messages = [
    {
      id: 1,
      capsuleId: 1,
      userId: 1,
      content: "Remember our first day back at school!",
    },
    {
      id: 2,
      capsuleId: 1,
      userId: 2,
      content: "We need to save our homecoming photos.",
    },
    {
      id: 3,
      capsuleId: 1,
      userId: 3,
      content: "Can't wait to look back at these memories.",
    },
    {
      id: 4,
      capsuleId: 2,
      userId: 2,
      content: "Our beach trip was unforgettable.",
    },
    {
      id: 5,
      capsuleId: 2,
      userId: 3,
      content: "Save this note for the end of summer.",
    },
    {
      id: 6,
      capsuleId: 2,
      userId: 2,
      content: "Let's do another trip next year.",
    },
  ];

  return { users, groups, memberships, capsules, messages };
}

function validateSampleData(data) {
  const userIds = new Set(data.users.map((user) => user.id));
  const groupIds = new Set(data.groups.map((group) => group.id));
  const capsuleIds = new Set(data.capsules.map((capsule) => capsule.id));

  for (const group of data.groups) {
    if (!userIds.has(group.createdBy)) {
      throw new Error(`Group ${group.id} has an invalid creator.`);
    }
  }

  for (const membership of data.memberships) {
    if (
      !groupIds.has(membership.groupId) ||
      !userIds.has(membership.userId)
    ) {
      throw new Error("A group membership references a missing record.");
    }
  }

  for (const capsule of data.capsules) {
    if (
      !groupIds.has(capsule.groupId) ||
      !userIds.has(capsule.createdBy)
    ) {
      throw new Error(`Capsule ${capsule.id} has an invalid reference.`);
    }
  }

  for (const message of data.messages) {
    if (
      !capsuleIds.has(message.capsuleId) ||
      !userIds.has(message.userId)
    ) {
      throw new Error(`Message ${message.id} has an invalid reference.`);
    }
  }
}

function seedDatabase() {
  const data = generateSampleData();

  validateSampleData(data);

  fs.mkdirSync(outputDirectory, { recursive: true });

  fs.writeFileSync(
    outputFile,
    JSON.stringify(data, null, 2) + "\n",
    "utf8"
  );

  console.log("Sample data generated successfully!");
  console.log(`Users: ${data.users.length}`);
  console.log(`Groups: ${data.groups.length}`);
  console.log(`Memberships: ${data.memberships.length}`);
  console.log(`Capsules: ${data.capsules.length}`);
  console.log(`Messages: ${data.messages.length}`);
  console.log(`Output: ${outputFile}`);
}

try {
  seedDatabase();
} catch (error) {
  console.error("Sample data generation failed:", error.message);
  process.exitCode = 1;
}
