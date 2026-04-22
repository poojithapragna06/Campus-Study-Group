import { render, screen, fireEvent } from "@testing-library/react";
import LoginPage from "../../src/pages/LoginPage";

// Mock the useLogin hook to avoid real API calls
jest.mock("../../src/hooks/useLogin", () => {
  return () => ({
    isPending: false,
    error: null,
    loginMutation: jest.fn(),
  });
});

describe("LoginPage Component Unit Test", () => {
  it("renders login form inputs", () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText("hello@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
  });

  it("submits login form with entered credentials", () => {
    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText("hello@example.com"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByText("Sign In"));

    const hook = require("../../src/hooks/useLogin")();
    expect(hook.loginMutation).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
  });

  it("shows error message when login fails", () => {
    // Override mock to simulate error
    jest.mock("../../src/hooks/useLogin", () => {
      return () => ({
        isPending: false,
        error: { response: { data: { message: "Invalid credentials" } } },
        loginMutation: jest.fn(),
      });
    });

    render(<LoginPage />);
    expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
  });

  it("shows loading state when isPending is true", () => {
    // Override mock to simulate loading
    jest.mock("../../src/hooks/useLogin", () => {
      return () => ({
        isPending: true,
        error: null,
        loginMutation: jest.fn(),
      });
    });

    render(<LoginPage />);
    expect(screen.getByText(/Signing in.../i)).toBeInTheDocument();
  });
});