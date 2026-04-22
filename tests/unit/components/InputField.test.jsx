import { render, screen, fireEvent } from "@testing-library/react";

// Example InputField component (replace with your actual import)
const InputField = ({ label, placeholder, type = "text", value, onChange }) => (
  <div className="form-control">
    <label className="label">
      <span className="label-text">{label}</span>
    </label>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="input input-bordered w-full"
    />
  </div>
);

describe("InputField Component Unit Test", () => {
  it("renders input with label and placeholder", () => {
    render(<InputField label="Email" placeholder="hello@example.com" />);
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("hello@example.com")).toBeInTheDocument();
  });

  it("accepts user input", () => {
    const handleChange = jest.fn();
    render(
      <InputField
        label="Password"
        placeholder="••••••••"
        type="password"
        value=""
        onChange={handleChange}
      />
    );

    const input = screen.getByPlaceholderText("••••••••");
    fireEvent.change(input, { target: { value: "mypassword" } });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(input.value).toBe("mypassword");
  });

  it("applies correct type attribute", () => {
    render(<InputField label="Password" placeholder="••••••••" type="password" />);
    const input = screen.getByPlaceholderText("••••••••");
    expect(input).toHaveAttribute("type", "password");
  });
});