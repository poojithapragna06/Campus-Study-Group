import { render, screen } from "@testing-library/react";
import Dashboard from "../../src/pages/Dashboard";

// Mock API service for fetching dashboard data
jest.mock("../../src/services/dashboardService", () => ({
  fetchData: jest.fn(() => Promise.resolve({ groups: ["Group A", "Group B"] })),
}));

describe("Dashboard Component Unit Test", () => {
  it("renders dashboard with groups", async () => {
    render(<Dashboard />);
    expect(await screen.findByText("Group A")).toBeInTheDocument();
    expect(await screen.findByText("Group B")).toBeInTheDocument();
  });

  it("shows error when API fails", async () => {
    jest.mock("../../src/services/dashboardService", () => ({
      fetchData: jest.fn(() => Promise.reject({ message: "Unable to load data" })),
    }));

    render(<Dashboard />);
    expect(await screen.findByText("Unable to load data")).toBeInTheDocument();
  });
});