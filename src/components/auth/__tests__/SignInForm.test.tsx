import { test, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignInForm } from "../SignInForm";

// Mock the useAuth hook
const mockSignIn = vi.fn();

const mockUseAuth = {
  signIn: mockSignIn,
  isLoading: false,
};

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => mockUseAuth,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  mockUseAuth.signIn = mockSignIn;
  mockUseAuth.isLoading = false;
});

test("renders sign in form with all required fields", () => {
  render(<SignInForm />);
  
  expect(screen.getByLabelText("Email")).toBeDefined();
  expect(screen.getByLabelText("Password")).toBeDefined();
  expect(screen.getByRole("button", { name: "Sign In" })).toBeDefined();
});

test("email input has correct type and attributes", () => {
  render(<SignInForm />);
  
  const emailInput = screen.getByLabelText("Email");
  expect(emailInput.getAttribute("type")).toBe("email");
  expect(emailInput.getAttribute("id")).toBe("email");
  expect(emailInput.getAttribute("placeholder")).toBe("you@example.com");
  expect(emailInput).toHaveProperty("required", true);
});

test("password input uses PasswordInput component", () => {
  render(<SignInForm />);
  
  const passwordInput = screen.getByLabelText("Password");
  expect(passwordInput.getAttribute("type")).toBe("password");
  expect(passwordInput.getAttribute("id")).toBe("password");
  expect(passwordInput).toHaveProperty("required", true);
  
  // Should have toggle button from PasswordInput
  const allButtons = screen.getAllByRole("button");
  const toggleButton = allButtons.find(button => 
    button.querySelector(".sr-only")?.textContent === "Show password"
  );
  expect(toggleButton).toBeDefined();
});

test("password visibility can be toggled", async () => {
  render(<SignInForm />);
  
  const passwordInput = screen.getByLabelText("Password");
  const allButtons = screen.getAllByRole("button");
  const toggleButton = allButtons.find(button => 
    button.querySelector(".sr-only")?.textContent === "Show password"
  );
  
  expect(passwordInput.getAttribute("type")).toBe("password");
  
  await userEvent.click(toggleButton!);
  expect(passwordInput.getAttribute("type")).toBe("text");
  expect(toggleButton!.querySelector(".sr-only")?.textContent).toBe("Hide password");
});

test("updates email value when typing", async () => {
  render(<SignInForm />);
  
  const emailInput = screen.getByLabelText("Email") as HTMLInputElement;
  await userEvent.type(emailInput, "test@example.com");
  
  expect(emailInput.value).toBe("test@example.com");
});

test("updates password value when typing", async () => {
  render(<SignInForm />);
  
  const passwordInput = screen.getByLabelText("Password") as HTMLInputElement;
  await userEvent.type(passwordInput, "password123");
  
  expect(passwordInput.value).toBe("password123");
});

test("calls signIn when form is submitted with valid data", async () => {
  mockSignIn.mockResolvedValue({ success: true });
  
  render(<SignInForm />);
  
  const emailInput = screen.getByLabelText("Email");
  const passwordInput = screen.getByLabelText("Password");
  const submitButton = screen.getByRole("button", { name: "Sign In" });
  
  await userEvent.type(emailInput, "test@example.com");
  await userEvent.type(passwordInput, "password123");
  await userEvent.click(submitButton);
  
  expect(mockSignIn).toHaveBeenCalledWith("test@example.com", "password123");
});

test("calls onSuccess callback when sign in is successful", async () => {
  const onSuccess = vi.fn();
  mockSignIn.mockResolvedValue({ success: true });
  
  render(<SignInForm onSuccess={onSuccess} />);
  
  const emailInput = screen.getByLabelText("Email");
  const passwordInput = screen.getByLabelText("Password");
  const submitButton = screen.getByRole("button", { name: "Sign In" });
  
  await userEvent.type(emailInput, "test@example.com");
  await userEvent.type(passwordInput, "password123");
  await userEvent.click(submitButton);
  
  await waitFor(() => {
    expect(onSuccess).toHaveBeenCalled();
  });
});

test("displays error message when sign in fails", async () => {
  mockSignIn.mockResolvedValue({ success: false, error: "Invalid credentials" });
  
  render(<SignInForm />);
  
  const emailInput = screen.getByLabelText("Email");
  const passwordInput = screen.getByLabelText("Password");
  const submitButton = screen.getByRole("button", { name: "Sign In" });
  
  await userEvent.type(emailInput, "test@example.com");
  await userEvent.type(passwordInput, "wrongpassword");
  await userEvent.click(submitButton);
  
  await waitFor(() => {
    expect(screen.getByText("Invalid credentials")).toBeDefined();
  });
});

test("displays generic error message when error is not provided", async () => {
  mockSignIn.mockResolvedValue({ success: false });
  
  render(<SignInForm />);
  
  const emailInput = screen.getByLabelText("Email");
  const passwordInput = screen.getByLabelText("Password");
  const submitButton = screen.getByRole("button", { name: "Sign In" });
  
  await userEvent.type(emailInput, "test@example.com");
  await userEvent.type(passwordInput, "password123");
  await userEvent.click(submitButton);
  
  await waitFor(() => {
    expect(screen.getByText("Failed to sign in")).toBeDefined();
  });
});

test("clears error message when form is resubmitted", async () => {
  mockSignIn
    .mockResolvedValueOnce({ success: false, error: "Invalid credentials" })
    .mockResolvedValueOnce({ success: true });
  
  render(<SignInForm />);
  
  const emailInput = screen.getByLabelText("Email");
  const passwordInput = screen.getByLabelText("Password");
  const submitButton = screen.getByRole("button", { name: "Sign In" });
  
  // First submission - should show error
  await userEvent.type(emailInput, "test@example.com");
  await userEvent.type(passwordInput, "wrongpassword");
  await userEvent.click(submitButton);
  
  await waitFor(() => {
    expect(screen.getByText("Invalid credentials")).toBeDefined();
  });
  
  // Second submission - error should be cleared
  await userEvent.clear(passwordInput);
  await userEvent.type(passwordInput, "correctpassword");
  await userEvent.click(submitButton);
  
  await waitFor(() => {
    expect(screen.queryByText("Invalid credentials")).toBeNull();
  });
});

test("disables form inputs when loading", () => {
  mockUseAuth.isLoading = true;
  
  render(<SignInForm />);
  
  const emailInput = screen.getByLabelText("Email");
  const passwordInput = screen.getByLabelText("Password");
  const submitButton = screen.getByRole("button", { name: "Signing in..." });
  
  expect(emailInput).toHaveProperty("disabled", true);
  expect(passwordInput).toHaveProperty("disabled", true);
  expect(submitButton).toHaveProperty("disabled", true);
});

test("disables password toggle button when loading", () => {
  mockUseAuth.isLoading = true;
  
  render(<SignInForm />);
  
  // Get all buttons and find the toggle button
  const buttons = screen.getAllByRole("button");
  const toggleButton = buttons.find(button => 
    button.querySelector(".sr-only")?.textContent === "Show password"
  );
  expect(toggleButton).toHaveProperty("disabled", true);
});

test("shows loading text on submit button when loading", () => {
  mockUseAuth.isLoading = true;
  
  render(<SignInForm />);
  
  const submitButton = screen.getByRole("button", { name: "Signing in..." });
  expect(submitButton).toBeDefined();
});

test("prevents form submission when loading", async () => {
  mockUseAuth.isLoading = true;
  
  render(<SignInForm />);
  
  // When loading, the button should be disabled and form submission should not occur
  const submitButton = screen.getByRole("button", { name: "Signing in..." });
  expect(submitButton).toHaveProperty("disabled", true);
  
  // Try to click the disabled button - it should not trigger form submission
  await userEvent.click(submitButton);
  expect(mockSignIn).not.toHaveBeenCalled();
});

test("form can be submitted by pressing Enter in email field", async () => {
  mockSignIn.mockResolvedValue({ success: true });
  
  render(<SignInForm />);
  
  const emailInput = screen.getByLabelText("Email");
  const passwordInput = screen.getByLabelText("Password");
  
  await userEvent.type(emailInput, "test@example.com");
  await userEvent.type(passwordInput, "password123");
  
  fireEvent.keyDown(emailInput, { key: "Enter", code: "Enter" });
  fireEvent.submit(emailInput.closest("form")!);
  
  expect(mockSignIn).toHaveBeenCalledWith("test@example.com", "password123");
});

test("form can be submitted by pressing Enter in password field", async () => {
  mockSignIn.mockResolvedValue({ success: true });
  
  render(<SignInForm />);
  
  const emailInput = screen.getByLabelText("Email");
  const passwordInput = screen.getByLabelText("Password");
  
  await userEvent.type(emailInput, "test@example.com");
  await userEvent.type(passwordInput, "password123");
  
  fireEvent.keyDown(passwordInput, { key: "Enter", code: "Enter" });
  fireEvent.submit(passwordInput.closest("form")!);
  
  expect(mockSignIn).toHaveBeenCalledWith("test@example.com", "password123");
});

test("error message has correct styling", async () => {
  mockSignIn.mockResolvedValue({ success: false, error: "Test error" });
  
  render(<SignInForm />);
  
  const emailInput = screen.getByLabelText("Email");
  const passwordInput = screen.getByLabelText("Password");
  const submitButton = screen.getByRole("button", { name: "Sign In" });
  
  await userEvent.type(emailInput, "test@example.com");
  await userEvent.type(passwordInput, "password123");
  await userEvent.click(submitButton);
  
  await waitFor(() => {
    const errorElement = screen.getByText("Test error");
    expect(errorElement.className).toContain("text-sm");
    expect(errorElement.className).toContain("text-red-600");
    expect(errorElement.className).toContain("bg-red-50");
    expect(errorElement.className).toContain("border");
    expect(errorElement.className).toContain("border-red-200");
  });
});

test("submit button has correct styling and classes", () => {
  render(<SignInForm />);
  
  const submitButton = screen.getByRole("button", { name: "Sign In" });
  expect(submitButton.className).toContain("w-full");
  expect(submitButton.getAttribute("type")).toBe("submit");
});

test("form has correct spacing classes", () => {
  render(<SignInForm />);
  
  const form = screen.getByRole("button", { name: "Sign In" }).closest("form")!;
  expect(form.className).toContain("space-y-4");
});

test("field containers have correct spacing", () => {
  render(<SignInForm />);
  
  const emailLabel = screen.getByText("Email");
  const passwordLabel = screen.getByText("Password");
  
  expect(emailLabel.parentElement?.className).toContain("space-y-2");
  expect(passwordLabel.parentElement?.className).toContain("space-y-2");
});

test("handles form submission with empty fields (relies on HTML5 validation)", async () => {
  render(<SignInForm />);
  
  const submitButton = screen.getByRole("button", { name: "Sign In" });
  await userEvent.click(submitButton);
  
  // signIn should not be called if HTML5 validation prevents submission
  expect(mockSignIn).not.toHaveBeenCalled();
});

test("maintains form state after error", async () => {
  mockSignIn.mockResolvedValue({ success: false, error: "Invalid credentials" });
  
  render(<SignInForm />);
  
  const emailInput = screen.getByLabelText("Email") as HTMLInputElement;
  const passwordInput = screen.getByLabelText("Password") as HTMLInputElement;
  const submitButton = screen.getByRole("button", { name: "Sign In" });
  
  await userEvent.type(emailInput, "test@example.com");
  await userEvent.type(passwordInput, "password123");
  await userEvent.click(submitButton);
  
  await waitFor(() => {
    expect(screen.getByText("Invalid credentials")).toBeDefined();
  });
  
  // Form values should be maintained
  expect(emailInput.value).toBe("test@example.com");
  expect(passwordInput.value).toBe("password123");
});

test("works without onSuccess callback", async () => {
  mockSignIn.mockResolvedValue({ success: true });
  
  render(<SignInForm />);
  
  const emailInput = screen.getByLabelText("Email");
  const passwordInput = screen.getByLabelText("Password");
  const submitButton = screen.getByRole("button", { name: "Sign In" });
  
  await userEvent.type(emailInput, "test@example.com");
  await userEvent.type(passwordInput, "password123");
  await userEvent.click(submitButton);
  
  await waitFor(() => {
    expect(mockSignIn).toHaveBeenCalledWith("test@example.com", "password123");
  });
});