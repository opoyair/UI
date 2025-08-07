import { test, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignUpForm } from "../SignUpForm";

// Mock the useAuth hook
const mockSignUp = vi.fn();

const mockUseAuth = {
  signUp: mockSignUp,
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
  mockUseAuth.signUp = mockSignUp;
  mockUseAuth.isLoading = false;
});

test("renders sign up form with all required fields", () => {
  render(<SignUpForm />);
  
  expect(screen.getByLabelText("Email")).toBeDefined();
  expect(screen.getByLabelText("Password")).toBeDefined();
  expect(screen.getByLabelText("Confirm Password")).toBeDefined();
  expect(screen.getByRole("button", { name: "Sign Up" })).toBeDefined();
});

test("email input has correct type and attributes", () => {
  render(<SignUpForm />);
  
  const emailInput = screen.getByLabelText("Email");
  expect(emailInput.getAttribute("type")).toBe("email");
  expect(emailInput.getAttribute("id")).toBe("email");
  expect(emailInput.getAttribute("placeholder")).toBe("you@example.com");
  expect(emailInput).toHaveProperty("required", true);
});

test("password input uses PasswordInput component with minLength", () => {
  render(<SignUpForm />);
  
  const passwordInput = screen.getByLabelText("Password");
  expect(passwordInput.getAttribute("type")).toBe("password");
  expect(passwordInput.getAttribute("id")).toBe("password");
  expect(passwordInput.getAttribute("minLength")).toBe("8");
  expect(passwordInput).toHaveProperty("required", true);
  
  // Should have toggle buttons from PasswordInput (3 total: 2 password toggles + 1 submit)
  const allButtons = screen.getAllByRole("button");
  const toggleButtons = allButtons.filter(button => 
    button.querySelector(".sr-only")?.textContent?.includes("password")
  );
  expect(toggleButtons.length).toBe(2); // Two password fields
});

test("confirm password input uses PasswordInput component", () => {
  render(<SignUpForm />);
  
  const confirmPasswordInput = screen.getByLabelText("Confirm Password");
  expect(confirmPasswordInput.getAttribute("type")).toBe("password");
  expect(confirmPasswordInput.getAttribute("id")).toBe("confirmPassword");
  expect(confirmPasswordInput).toHaveProperty("required", true);
});

test("displays password requirement text", () => {
  render(<SignUpForm />);
  
  expect(screen.getByText("Must be at least 8 characters long")).toBeDefined();
});

test("password visibility can be toggled independently", async () => {
  render(<SignUpForm />);
  
  const passwordInput = screen.getByLabelText("Password");
  const confirmPasswordInput = screen.getByLabelText("Confirm Password");
  
  // Get all buttons and filter for password toggle buttons
  const allButtons = screen.getAllByRole("button");
  const toggleButtons = allButtons.filter(button => 
    button.querySelector(".sr-only")?.textContent?.includes("password")
  );
  
  expect(passwordInput.getAttribute("type")).toBe("password");
  expect(confirmPasswordInput.getAttribute("type")).toBe("password");
  
  // Toggle first password field
  await userEvent.click(toggleButtons[0]);
  expect(passwordInput.getAttribute("type")).toBe("text");
  expect(confirmPasswordInput.getAttribute("type")).toBe("password"); // Should remain password
  
  // Toggle second password field
  await userEvent.click(toggleButtons[1]);
  expect(passwordInput.getAttribute("type")).toBe("text");
  expect(confirmPasswordInput.getAttribute("type")).toBe("text");
});

test("updates email value when typing", async () => {
  render(<SignUpForm />);
  
  const emailInput = screen.getByLabelText("Email") as HTMLInputElement;
  await userEvent.type(emailInput, "test@example.com");
  
  expect(emailInput.value).toBe("test@example.com");
});

test("updates password value when typing", async () => {
  render(<SignUpForm />);
  
  const passwordInput = screen.getByLabelText("Password") as HTMLInputElement;
  await userEvent.type(passwordInput, "password123");
  
  expect(passwordInput.value).toBe("password123");
});

test("updates confirm password value when typing", async () => {
  render(<SignUpForm />);
  
  const confirmPasswordInput = screen.getByLabelText("Confirm Password") as HTMLInputElement;
  await userEvent.type(confirmPasswordInput, "password123");
  
  expect(confirmPasswordInput.value).toBe("password123");
});

test("calls signUp when form is submitted with valid matching passwords", async () => {
  mockSignUp.mockResolvedValue({ success: true });
  
  render(<SignUpForm />);
  
  const emailInput = screen.getByLabelText("Email");
  const passwordInput = screen.getByLabelText("Password");
  const confirmPasswordInput = screen.getByLabelText("Confirm Password");
  const submitButton = screen.getByRole("button", { name: "Sign Up" });
  
  await userEvent.type(emailInput, "test@example.com");
  await userEvent.type(passwordInput, "password123");
  await userEvent.type(confirmPasswordInput, "password123");
  await userEvent.click(submitButton);
  
  expect(mockSignUp).toHaveBeenCalledWith("test@example.com", "password123");
});

test("shows error when passwords do not match", async () => {
  render(<SignUpForm />);
  
  const emailInput = screen.getByLabelText("Email");
  const passwordInput = screen.getByLabelText("Password");
  const confirmPasswordInput = screen.getByLabelText("Confirm Password");
  const submitButton = screen.getByRole("button", { name: "Sign Up" });
  
  await userEvent.type(emailInput, "test@example.com");
  await userEvent.type(passwordInput, "password123");
  await userEvent.type(confirmPasswordInput, "differentpassword");
  await userEvent.click(submitButton);
  
  await waitFor(() => {
    expect(screen.getByText("Passwords do not match")).toBeDefined();
  });
  
  // signUp should not be called
  expect(mockSignUp).not.toHaveBeenCalled();
});

test("calls onSuccess callback when sign up is successful", async () => {
  const onSuccess = vi.fn();
  mockSignUp.mockResolvedValue({ success: true });
  
  render(<SignUpForm onSuccess={onSuccess} />);
  
  const emailInput = screen.getByLabelText("Email");
  const passwordInput = screen.getByLabelText("Password");
  const confirmPasswordInput = screen.getByLabelText("Confirm Password");
  const submitButton = screen.getByRole("button", { name: "Sign Up" });
  
  await userEvent.type(emailInput, "test@example.com");
  await userEvent.type(passwordInput, "password123");
  await userEvent.type(confirmPasswordInput, "password123");
  await userEvent.click(submitButton);
  
  await waitFor(() => {
    expect(onSuccess).toHaveBeenCalled();
  });
});

test("displays error message when sign up fails", async () => {
  mockSignUp.mockResolvedValue({ success: false, error: "Email already exists" });
  
  render(<SignUpForm />);
  
  const emailInput = screen.getByLabelText("Email");
  const passwordInput = screen.getByLabelText("Password");
  const confirmPasswordInput = screen.getByLabelText("Confirm Password");
  const submitButton = screen.getByRole("button", { name: "Sign Up" });
  
  await userEvent.type(emailInput, "test@example.com");
  await userEvent.type(passwordInput, "password123");
  await userEvent.type(confirmPasswordInput, "password123");
  await userEvent.click(submitButton);
  
  await waitFor(() => {
    expect(screen.getByText("Email already exists")).toBeDefined();
  });
});

test("displays generic error message when error is not provided", async () => {
  mockSignUp.mockResolvedValue({ success: false });
  
  render(<SignUpForm />);
  
  const emailInput = screen.getByLabelText("Email");
  const passwordInput = screen.getByLabelText("Password");
  const confirmPasswordInput = screen.getByLabelText("Confirm Password");
  const submitButton = screen.getByRole("button", { name: "Sign Up" });
  
  await userEvent.type(emailInput, "test@example.com");
  await userEvent.type(passwordInput, "password123");
  await userEvent.type(confirmPasswordInput, "password123");
  await userEvent.click(submitButton);
  
  await waitFor(() => {
    expect(screen.getByText("Failed to sign up")).toBeDefined();
  });
});

test("clears error message when form is resubmitted", async () => {
  render(<SignUpForm />);
  
  const emailInput = screen.getByLabelText("Email");
  const passwordInput = screen.getByLabelText("Password");
  const confirmPasswordInput = screen.getByLabelText("Confirm Password");
  const submitButton = screen.getByRole("button", { name: "Sign Up" });
  
  // First submission with mismatched passwords
  await userEvent.type(emailInput, "test@example.com");
  await userEvent.type(passwordInput, "password123");
  await userEvent.type(confirmPasswordInput, "differentpassword");
  await userEvent.click(submitButton);
  
  await waitFor(() => {
    expect(screen.getByText("Passwords do not match")).toBeDefined();
  });
  
  // Fix the confirm password and resubmit
  await userEvent.clear(confirmPasswordInput);
  await userEvent.type(confirmPasswordInput, "password123");
  
  mockSignUp.mockResolvedValue({ success: true });
  await userEvent.click(submitButton);
  
  await waitFor(() => {
    expect(screen.queryByText("Passwords do not match")).toBeNull();
  });
});

test("disables form inputs when loading", () => {
  mockUseAuth.isLoading = true;
  
  render(<SignUpForm />);
  
  const emailInput = screen.getByLabelText("Email");
  const passwordInput = screen.getByLabelText("Password");
  const confirmPasswordInput = screen.getByLabelText("Confirm Password");
  const submitButton = screen.getByRole("button", { name: "Creating account..." });
  
  expect(emailInput).toHaveProperty("disabled", true);
  expect(passwordInput).toHaveProperty("disabled", true);
  expect(confirmPasswordInput).toHaveProperty("disabled", true);
  expect(submitButton).toHaveProperty("disabled", true);
});

test("disables password toggle buttons when loading", () => {
  mockUseAuth.isLoading = true;
  
  render(<SignUpForm />);
  
  // Get all buttons and filter for password toggle buttons
  const allButtons = screen.getAllByRole("button");
  const toggleButtons = allButtons.filter(button => 
    button.querySelector(".sr-only")?.textContent?.includes("password")
  );
  expect(toggleButtons).toHaveLength(2);
  toggleButtons.forEach(button => {
    expect(button).toHaveProperty("disabled", true);
  });
});

test("shows loading text on submit button when loading", () => {
  mockUseAuth.isLoading = true;
  
  render(<SignUpForm />);
  
  const submitButton = screen.getByRole("button", { name: "Creating account..." });
  expect(submitButton).toBeDefined();
});

test("prevents form submission when loading", async () => {
  mockUseAuth.isLoading = true;
  
  render(<SignUpForm />);
  
  // When loading, the button should be disabled and form submission should not occur
  const submitButton = screen.getByRole("button", { name: "Creating account..." });
  expect(submitButton).toHaveProperty("disabled", true);
  
  // Try to click the disabled button - it should not trigger form submission
  await userEvent.click(submitButton);
  expect(mockSignUp).not.toHaveBeenCalled();
});

test("form can be submitted by pressing Enter", async () => {
  mockSignUp.mockResolvedValue({ success: true });
  
  render(<SignUpForm />);
  
  const emailInput = screen.getByLabelText("Email");
  const passwordInput = screen.getByLabelText("Password");
  const confirmPasswordInput = screen.getByLabelText("Confirm Password");
  
  await userEvent.type(emailInput, "test@example.com");
  await userEvent.type(passwordInput, "password123");
  await userEvent.type(confirmPasswordInput, "password123");
  
  fireEvent.keyDown(confirmPasswordInput, { key: "Enter", code: "Enter" });
  fireEvent.submit(confirmPasswordInput.closest("form")!);
  
  expect(mockSignUp).toHaveBeenCalledWith("test@example.com", "password123");
});

test("error message has correct styling", async () => {
  render(<SignUpForm />);
  
  const emailInput = screen.getByLabelText("Email");
  const passwordInput = screen.getByLabelText("Password");
  const confirmPasswordInput = screen.getByLabelText("Confirm Password");
  const submitButton = screen.getByRole("button", { name: "Sign Up" });
  
  await userEvent.type(emailInput, "test@example.com");
  await userEvent.type(passwordInput, "password123");
  await userEvent.type(confirmPasswordInput, "differentpassword");
  await userEvent.click(submitButton);
  
  await waitFor(() => {
    const errorElement = screen.getByText("Passwords do not match");
    expect(errorElement.className).toContain("text-sm");
    expect(errorElement.className).toContain("text-red-600");
    expect(errorElement.className).toContain("bg-red-50");
    expect(errorElement.className).toContain("border");
    expect(errorElement.className).toContain("border-red-200");
  });
});

test("submit button has correct styling and classes", () => {
  render(<SignUpForm />);
  
  const submitButton = screen.getByRole("button", { name: "Sign Up" });
  expect(submitButton.className).toContain("w-full");
  expect(submitButton.getAttribute("type")).toBe("submit");
});

test("form has correct spacing classes", () => {
  render(<SignUpForm />);
  
  const form = screen.getByRole("button", { name: "Sign Up" }).closest("form")!;
  expect(form.className).toContain("space-y-4");
});

test("field containers have correct spacing", () => {
  render(<SignUpForm />);
  
  const emailLabel = screen.getByText("Email");
  const passwordLabel = screen.getByText("Password");
  const confirmPasswordLabel = screen.getByText("Confirm Password");
  
  expect(emailLabel.parentElement?.className).toContain("space-y-2");
  expect(passwordLabel.parentElement?.className).toContain("space-y-2");
  expect(confirmPasswordLabel.parentElement?.className).toContain("space-y-2");
});

test("password requirement text has correct styling", () => {
  render(<SignUpForm />);
  
  const requirementText = screen.getByText("Must be at least 8 characters long");
  expect(requirementText.className).toContain("text-xs");
  expect(requirementText.className).toContain("text-gray-500");
});

test("handles form submission with empty fields (relies on HTML5 validation)", async () => {
  render(<SignUpForm />);
  
  const submitButton = screen.getByRole("button", { name: "Sign Up" });
  await userEvent.click(submitButton);
  
  // signUp should not be called if HTML5 validation prevents submission
  expect(mockSignUp).not.toHaveBeenCalled();
});

test("maintains form state after password mismatch error", async () => {
  render(<SignUpForm />);
  
  const emailInput = screen.getByLabelText("Email") as HTMLInputElement;
  const passwordInput = screen.getByLabelText("Password") as HTMLInputElement;
  const confirmPasswordInput = screen.getByLabelText("Confirm Password") as HTMLInputElement;
  const submitButton = screen.getByRole("button", { name: "Sign Up" });
  
  await userEvent.type(emailInput, "test@example.com");
  await userEvent.type(passwordInput, "password123");
  await userEvent.type(confirmPasswordInput, "differentpassword");
  await userEvent.click(submitButton);
  
  await waitFor(() => {
    expect(screen.getByText("Passwords do not match")).toBeDefined();
  });
  
  // Form values should be maintained
  expect(emailInput.value).toBe("test@example.com");
  expect(passwordInput.value).toBe("password123");
  expect(confirmPasswordInput.value).toBe("differentpassword");
});

test("maintains form state after server error", async () => {
  mockSignUp.mockResolvedValue({ success: false, error: "Server error" });
  
  render(<SignUpForm />);
  
  const emailInput = screen.getByLabelText("Email") as HTMLInputElement;
  const passwordInput = screen.getByLabelText("Password") as HTMLInputElement;
  const confirmPasswordInput = screen.getByLabelText("Confirm Password") as HTMLInputElement;
  const submitButton = screen.getByRole("button", { name: "Sign Up" });
  
  await userEvent.type(emailInput, "test@example.com");
  await userEvent.type(passwordInput, "password123");
  await userEvent.type(confirmPasswordInput, "password123");
  await userEvent.click(submitButton);
  
  await waitFor(() => {
    expect(screen.getByText("Server error")).toBeDefined();
  });
  
  // Form values should be maintained
  expect(emailInput.value).toBe("test@example.com");
  expect(passwordInput.value).toBe("password123");
  expect(confirmPasswordInput.value).toBe("password123");
});

test("works without onSuccess callback", async () => {
  mockSignUp.mockResolvedValue({ success: true });
  
  render(<SignUpForm />);
  
  const emailInput = screen.getByLabelText("Email");
  const passwordInput = screen.getByLabelText("Password");
  const confirmPasswordInput = screen.getByLabelText("Confirm Password");
  const submitButton = screen.getByRole("button", { name: "Sign Up" });
  
  await userEvent.type(emailInput, "test@example.com");
  await userEvent.type(passwordInput, "password123");
  await userEvent.type(confirmPasswordInput, "password123");
  await userEvent.click(submitButton);
  
  await waitFor(() => {
    expect(mockSignUp).toHaveBeenCalledWith("test@example.com", "password123");
  });
});

test("password input has minLength attribute for HTML5 validation", () => {
  render(<SignUpForm />);
  
  const passwordInput = screen.getByLabelText("Password");
  
  // Test that the minLength attribute is set correctly
  expect(passwordInput.getAttribute("minLength")).toBe("8");
  
  // Test that the password input accepts the minLength constraint
  expect(passwordInput).toHaveProperty("minLength", 8);
});

test("clears password mismatch error when passwords start matching", async () => {
  render(<SignUpForm />);
  
  const emailInput = screen.getByLabelText("Email");
  const passwordInput = screen.getByLabelText("Password");
  const confirmPasswordInput = screen.getByLabelText("Confirm Password");
  const submitButton = screen.getByRole("button", { name: "Sign Up" });
  
  // Create password mismatch error
  await userEvent.type(emailInput, "test@example.com");
  await userEvent.type(passwordInput, "password123");
  await userEvent.type(confirmPasswordInput, "differentpassword");
  await userEvent.click(submitButton);
  
  await waitFor(() => {
    expect(screen.getByText("Passwords do not match")).toBeDefined();
  });
  
  // Fix password and try again
  await userEvent.clear(confirmPasswordInput);
  await userEvent.type(confirmPasswordInput, "password123");
  
  mockSignUp.mockResolvedValue({ success: true });
  await userEvent.click(submitButton);
  
  // Error should be cleared
  await waitFor(() => {
    expect(screen.queryByText("Passwords do not match")).toBeNull();
  });
  
  expect(mockSignUp).toHaveBeenCalledWith("test@example.com", "password123");
});