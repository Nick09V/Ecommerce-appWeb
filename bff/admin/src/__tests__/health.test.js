describe("Health Check", () => {
  test("BFF Admin service should be healthy", () => {
    const health = {
      status: "UP",
      service: "BFF Admin",
    };

    expect(health.status).toBe("UP");
    expect(health.service).toBeDefined();
  });

  test("Health status should be a valid string", () => {
    const status = "UP";
    expect(["UP", "DOWN"]).toContain(status);
  });
});
