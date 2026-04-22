import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import LoginPage from "../../src/pages/LoginPage";
import SignUpPage from "../../src/pages/SignUpPage";

describe("Routing Integration Test", () => {
  it("navigates to LoginPage by default", () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Welcome Back/i)).toBeInTheDocument();
  });

  it("navigates to SignUpPage", () => {
    render(
      <MemoryRouter initialEntries={["/signup"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Create an Account/i)).toBeInTheDocument();
  });

  it("shows link from LoginPage to SignUpPage", () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
        </Routes>
      </MemoryRouter>
    );

    const link = screen.getByText(/Create one/i);
    expect(link).toHaveAttribute("href", "/signup");
  });

  it("shows link from SignUpPage to LoginPage", () => {
    render(
      <MemoryRouter initialEntries={["/signup"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
        </Routes>
      </MemoryRouter>
    );

    const link = screen.getByText(/Sign in/i);
    expect(link).toHaveAttribute("href", "/login");
  });
});