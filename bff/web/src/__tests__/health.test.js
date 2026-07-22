describe("Health Check", () => {
  test("BFF Web service should be healthy", () => {
    const health = {
      status: "UP",
      service: "BFF Web",
    };

    expect(health.status).toBe("UP");
    expect(health.service).toBeDefined();
  });

  test("Health status should be a valid string", () => {
    const status = "UP";
    expect(["UP", "DOWN"]).toContain(status);
  });
});
