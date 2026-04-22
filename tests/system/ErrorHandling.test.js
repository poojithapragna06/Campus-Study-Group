import { render, screen, fireEvent } from "@testing-library/react";
import LoginPage from "../../src/pages/LoginPage";
import SignUpPage from "../../src/pages/SignUpPage";

// Mock hooks to simulate error states
jest.mock("../../src/hooks/useLogin", () => {
  return () => ({
    isPending: false,
    error: { response: { data: { message: "Invalid credentials" } } },
    loginMutation: jest.fn(),
  });
});

jest.mock("../../src/hooks/useSignUp", () => {
  return () => ({
    isPending: false,
    error: { response: { data: { message: "Email already exists" } } },
    signupMutation: jest.fn(),
  });
});

describe("System Error Handling Tests", () => {
  it("shows error when login fails", () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText("hello@example.com"), {
      target: { value: "wrong@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "badpassword" },
    });
    fireEvent.click(screen.getByText("Sign In"));

    expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
  });

  it("shows error when signup fails", () => {
    render(<SignUpPage />);
    fireEvent.change(screen.getByPlaceholderText("John Doe"), {
      target: { value: "Existing User" },
    });
    fireEvent.change(screen.getByPlaceholderText("john@gmail.com"), {
      target: { value: "existing@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("********"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByText("Create Account"));

    expect(screen.getByText("Email already exists")).toBeInTheDocument();
  });

  it("shows validation error when required fields are empty", () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText("Sign In")); // submit without filling
    // HTML5 validation prevents submission, but we can check inputs
    expect(screen.getByPlaceholderText("hello@example.com")).toBeRequired();
    expect(screen.getByPlaceholderText("••••••••")).toBeRequired();
  });
});