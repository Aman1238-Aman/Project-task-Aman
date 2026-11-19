const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test, after } = require("node:test");

const testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "coy-discover-api-"));
process.env.COY_LOCAL_STORE_PATH = path.join(testDirectory, "swipes.json");

const feedRoute = require("../.next/server/app/api/feed/route.js").routeModule.userland;
const swipeRoute = require("../.next/server/app/api/swipe/route.js").routeModule.userland;
const matchesRoute = require("../.next/server/app/api/matches/route.js").routeModule.userland;

function request(body) {
  return new Request("http://localhost/api/swipe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

test("feed, privacy, swipe validation, matching, and persistence", async () => {
  const firstFeed = await (await feedRoute.GET(new Request("http://localhost/api/feed"))).json();
  assert.equal(firstFeed.profiles.length, 30);
  assert.ok(firstFeed.profiles.every((profile) => !Object.hasOwn(profile, "likedYou")));

  const mutualResponse = await swipeRoute.POST(request({ profileId: "profile-02", action: "like" }));
  const mutual = await mutualResponse.json();
  assert.equal(mutualResponse.status, 200);
  assert.equal(mutual.matched, true);
  assert.equal(mutual.profile.id, "profile-02");

  const refreshedFeed = await (await feedRoute.GET(new Request("http://localhost/api/feed"))).json();
  assert.equal(refreshedFeed.profiles.some((profile) => profile.id === "profile-02"), false);
  const matches = await (await matchesRoute.GET(new Request("http://localhost/api/matches"))).json();
  assert.deepEqual(matches.matches.map((profile) => profile.id), ["profile-02"]);

  const duplicate = await swipeRoute.POST(request({ profileId: "profile-02", action: "like" }));
  assert.equal(duplicate.status, 409);

  const simultaneous = await Promise.all([
    swipeRoute.POST(request({ profileId: "profile-04", action: "like" })),
    swipeRoute.POST(request({ profileId: "profile-04", action: "like" })),
  ]);
  assert.deepEqual(simultaneous.map((response) => response.status).sort(), [200, 409]);

  assert.equal((await swipeRoute.POST(request({ profileId: "not-a-profile", action: "like" }))).status, 400);
  assert.equal((await swipeRoute.POST(request({ profileId: "profile-03", action: "other" }))).status, 400);
  assert.equal((await swipeRoute.POST(request("{"))).status, 400);

  const passResponse = await swipeRoute.POST(request({ profileId: "profile-01", action: "pass" }));
  assert.equal(passResponse.status, 200);
  assert.equal((await passResponse.json()).matched, false);
  assert.equal((await (await feedRoute.GET(new Request("http://localhost/api/feed"))).json()).profiles.some((profile) => profile.id === "profile-01"), false);
});

after(() => fs.rmSync(testDirectory, { recursive: true, force: true }));
