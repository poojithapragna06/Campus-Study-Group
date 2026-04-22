import { render, screen, fireEvent } from "@testing-library/react";

// Example Button component (replace with your actual import)
const Button = ({ children, onClick }) => (
  <button onClick={onClick} className="btn btn-primary">
    {children}
  </button>
);

describe("Button Component Unit Test", () => {
  it("renders button with text", () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText("Click Me")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);

    fireEvent.click(screen.getByText("Click Me"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("applies correct className", () => {
    render(<Button>Styled Button</Button>);
    const button = screen.getByText("Styled Button");
    expect(button).toHaveClass("btn btn-primary");
  });
});