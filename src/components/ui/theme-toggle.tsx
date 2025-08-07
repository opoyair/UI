"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "./button";
import { useTheme } from "@/lib/contexts/theme-context";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, actualTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        disabled
      >
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ] as const;

  const currentThemeOption = themeOptions.find(option => option.value === theme);
  const CurrentIcon = currentThemeOption?.icon || Sun;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title={`Theme: ${currentThemeOption?.label || 'Light'}`}
        >
          <CurrentIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-1" align="end">
        <div className="space-y-1">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Button
                key={option.value}
                variant={theme === option.value ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => setTheme(option.value)}
              >
                <Icon className="h-4 w-4" />
                {option.label}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}