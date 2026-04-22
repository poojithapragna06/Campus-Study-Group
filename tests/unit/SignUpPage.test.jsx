import { render, screen, fireEvent } from "@testing-library/react";
import SignUpPage from "../../src/pages/SignUpPage";

// Mock the useSignUp hook to avoid real API calls
jest.mock("../../src/hooks/useSignUp", () => {
  return () => ({
    isPending: false,
    error: null,
    signupMutation: jest.fn(),
  });
});

describe("SignUpPage Component Unit Test", () => {
  it("renders signup form inputs", () => {
    render(<SignUpPage />);
    expect(screen.getByPlaceholderText("John Doe")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("john@gmail.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("********")).toBeInTheDocument();
  });

  it("submits signup form with entered data", () => {
    render(<SignUpPage />);

    fireEvent.change(screen.getByPlaceholderText("John Doe"), {
      target: { value: "Poojitha" },
    });
    fireEvent.change(screen.getByPlaceholderText("john@gmail.com"), {
      target: { value: "poojitha@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("********"), {
      target: { value: "securePass123" },
    });
    fireEvent.click(screen.getByRole("checkbox")); // agree to terms
    fireEvent.click(screen.getByText("Create Account"));

    const hook = require("../../src/hooks/useSignUp")();
    expect(hook.signupMutation).toHaveBeenCalledWith({
      username: "Poojitha",
      email: "poojitha@example.com",
      password: "securePass123",
    });
  });

  it("shows error message when signup fails", () => {
    // Override mock to simulate error
    jest.mock("../../src/hooks/useSignUp", () => {
      return () => ({
        isPending: false,
        error: { response: { data: { message: "Email already exists" } } },
        signupMutation: jest.fn(),
      });
    });

    render(<SignUpPage />);
    expect(screen.getByText("Email already exists")).toBeInTheDocument();
  });

  it("shows loading state when isPending is true", () => {
    // Override mock to simulate loading
    jest.mock("../../src/hooks/useSignUp", () => {
      return () => ({
        isPending: true,
        error: null,
        signupMutation: jest.fn(),
      });
    });

    render(<SignUpPage />);
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });
});