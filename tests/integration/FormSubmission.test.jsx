import { render, screen, fireEvent } from "@testing-library/react";
import SignUpPage from "../../src/pages/SignUpPage";

// Mock the signup hook so we can track calls
jest.mock("../../src/hooks/useSignUp", () => {
  return () => ({
    isPending: false,
    error: null,
    signupMutation: jest.fn(),
  });
});

describe("Form Submission Integration Test", () => {
  it("fills out and submits the signup form", () => {
    render(<SignUpPage />);

    // Fill inputs
    fireEvent.change(screen.getByPlaceholderText("John Doe"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByPlaceholderText("john@gmail.com"), {
      target: { value: "testuser@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("********"), {
      target: { value: "securePass123" },
    });

    // Agree to terms
    fireEvent.click(screen.getByRole("checkbox"));

    // Submit form
    fireEvent.click(screen.getByText("Create Account"));

    // Assert that signupMutation was called with correct data
    const hook = require("../../src/hooks/useSignUp")();
    expect(hook.signupMutation).toHaveBeenCalledWith({
      username: "Test User",
      email: "testuser@example.com",
      password: "securePass123",
    });
  });

  it("shows error message when error exists", () => {
    // Override mock to simulate error
    jest.mock("../../src/hooks/useSignUp", () => {
      return () => ({
        isPending: false,
        error: { response: { data: { message: "Signup failed" } } },
        signupMutation: jest.fn(),
      });
    });

    render(<SignUpPage />);
    expect(screen.getByText("Signup failed")).toBeInTheDocument();
  });
});