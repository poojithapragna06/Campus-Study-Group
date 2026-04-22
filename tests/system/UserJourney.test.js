import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import SignUpPage from "../../src/pages/SignUpPage";
import LoginPage from "../../src/pages/LoginPage";

// Mock hooks for signup and login
jest.mock("../../src/hooks/useSignUp", () => {
  return () => ({
    isPending: false,
    error: null,
    signupMutation: jest.fn(),
  });
});

jest.mock("../../src/hooks/useLogin", () => {
  return () => ({
    isPending: false,
    error: null,
    loginMutation: jest.fn(),
  });
});

// Dummy Dashboard component
const Dashboard = () => <h1>Welcome to Dashboard</h1>;

describe("System Test: User Journey", () => {
  it("allows user to sign up, log in, and reach dashboard", () => {
    render(
      <MemoryRouter initialEntries={["/signup"]}>
        <Routes>
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>
    );

    // --- SIGNUP FLOW ---
    fireEvent.change(screen.getByPlaceholderText("John Doe"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByPlaceholderText("john@gmail.com"), {
      target: { value: "testuser@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("********"), {
      target: { value: "securePass123" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByText("Create Account"));

    const signupHook = require("../../src/hooks/useSignUp")();
    expect(signupHook.signupMutation).toHaveBeenCalledWith({
      username: "Test User",
      email: "testuser@example.com",
      password: "securePass123",
    });

    // --- LOGIN FLOW ---
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("hello@example.com"), {
      target: { value: "testuser@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "securePass123" },
    });
    fireEvent.click(screen.getByText("Sign In"));

    const loginHook = require("../../src/hooks/useLogin")();
    expect(loginHook.loginMutation).toHaveBeenCalledWith({
      email: "testuser@example.com",
      password: "securePass123",
    });

    // --- DASHBOARD ---
    render(<Dashboard />);
    expect(screen.getByText("Welcome to Dashboard")).toBeInTheDocument();
  });
});