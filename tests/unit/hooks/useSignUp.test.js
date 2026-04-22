import { renderHook, act } from "@testing-library/react";
import useSignUp from "../../src/hooks/useSignUp";

describe("useSignUp Hook Unit Test", () => {
  it("initializes with default state", () => {
    const { result } = renderHook(() => useSignUp());
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.signupMutation).toBe("function");
  });

  it("calls signupMutation with correct data", () => {
    const { result } = renderHook(() => useSignUp());

    act(() => {
      result.current.signupMutation({
        username: "Test User",
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
    jest.mock("../../src/hooks/useSignUp", () => {
      return () => ({
        isPending: false,
        error: { response: { data: { message: "Email already exists" } } },
        signupMutation: jest.fn(),
      });
    });

    const { result } = renderHook(() => useSignUp());
    expect(result.current.error.response.data.message).toBe("Email already exists");
  });
});