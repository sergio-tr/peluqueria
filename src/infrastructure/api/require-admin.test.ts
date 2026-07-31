import { describe, expect, it, vi, beforeEach } from "vitest";

const getUserMock = vi.fn();
const staffMaybeSingleMock = vi.fn();

vi.mock("@/infrastructure/supabase/server-auth-client", () => ({
  createRequestAuthClient: () => ({
    auth: { getUser: getUserMock },
  }),
}));

vi.mock("@/infrastructure/supabase/client", () => ({
  createServiceClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: staffMaybeSingleMock,
          }),
        }),
      }),
    }),
  }),
}));

describe("requireAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  it("returns 401 when no session", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });
    const { requireAdmin } = await import("./require-admin");

    await expect(requireAdmin(new Request("http://localhost/api/admin/x"))).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      status: 401,
    });
  });

  it("returns 403 when user is not linked to active staff", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    staffMaybeSingleMock.mockResolvedValue({ data: null, error: null });
    const { requireAdmin } = await import("./require-admin");

    await expect(requireAdmin(new Request("http://localhost/api/admin/x"))).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });
  });

  it("accepts valid session with staff linkage", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    staffMaybeSingleMock.mockResolvedValue({ data: { id: "staff-1" }, error: null });
    const { requireAdmin } = await import("./require-admin");

    await expect(requireAdmin(new Request("http://localhost/api/admin/x"))).resolves.toEqual({
      userId: "user-1",
      staffId: "staff-1",
    });
  });

  it("accepts Bearer token auth", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-2" } },
      error: null,
    });
    staffMaybeSingleMock.mockResolvedValue({ data: { id: "staff-2" }, error: null });
    const { requireAdmin } = await import("./require-admin");

    const request = new Request("http://localhost/api/admin/x", {
      headers: { authorization: "Bearer test-jwt" },
    });
    await expect(requireAdmin(request)).resolves.toEqual({
      userId: "user-2",
      staffId: "staff-2",
    });
    expect(getUserMock).toHaveBeenCalledWith("test-jwt");
  });
});
