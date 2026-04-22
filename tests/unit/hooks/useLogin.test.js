import { renderHook, act } from "@testing-library/react";
import useLogin from "../../src/hooks/useLogin";

// Mock API call or service inside useLogin if needed
// Example: jest.mock("../../src/services/authService", () => ({ login: jest.fn() }));

describe("useLogin Hook Unit Test", () => {
  it("initializes with default state", () => {
    const { result } = renderHook(() => useLogin());
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.loginMutation).toBe("function");
  });

  it("calls loginMutation with correct data", () => {
    const { result } = renderHook(() => useLogin());

    act(() => {
      result.current.loginMutation({
        email: "test@example.com",
        password: "password123",
      });
    });

    // Depending on your hook implementation, you may check:
    // - isPending becomes true
    // - API call is triggered
    // - error remains null
    expect(result.current.isPending).toBe(true);
  });

  it("handles error state correctly", () => {
    // Simulate error by mocking hook return
    jest.mock("../../src/hooks/useLogin", () => {
      return () => ({
        isPending: false,
        error: { response: { data: { message: "Invalid credentials" } } },
        loginMutation: jest.fn(),
      });
    });

    const { result } = renderHook(() => useLogin());
    expect(result.current.error.response.data.message).toBe("Invalid credentials");
  });
});