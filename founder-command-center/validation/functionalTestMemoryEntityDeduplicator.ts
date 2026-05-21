import {
  normalizeEntityName,
  detectSuspiciousEntityName,
  deduplicateEntityNames
} from "../core-candidates/memoryEntityDeduplicator";

function assertEqual<T>(name: string, actual: T, expected: T) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    throw new Error(
      `${name} failed. Expected ${expectedJson}, got ${actualJson}`
    );
  }

  console.log(`PASS: ${name}`);
}

function runFunctionalTests() {
  assertEqual(
    "normalize duplicated entity name",
    normalizeEntityName("Moradia_Moradia_Boavista"),
    "Moradia_Boavista"
  );

  assertEqual(
    "detect duplicated entity name",
    detectSuspiciousEntityName("Moradia_Moradia_Boavista"),
    true
  );

  assertEqual(
    "do not flag clean entity name",
    detectSuspiciousEntityName("Moradia_Boavista"),
    false
  );

  assertEqual(
    "deduplicate after normalization",
    deduplicateEntityNames([
      "Moradia_Moradia_Boavista",
      "Moradia_Boavista"
    ]),
    ["Moradia_Boavista"]
  );

  assertEqual(
    "ignore empty tokens",
    normalizeEntityName("Moradia__Moradia__Boavista"),
    "Moradia_Boavista"
  );
}

runFunctionalTests();
