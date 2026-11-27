import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CareerResults } from "../Components/CareerCamera/CareerResults";
import type { AnalysisResult, Profession } from "../lib/career-camera/types";

const makeProfession = (name: string, description: string): Profession => ({
  name,
  icon: "",
  description,
  skills: ["Навык"],
  traits: [],
  salary: { min: 50000, max: 100000, currency: "₽" },
});

const result: AnalysisResult = {
  main: makeProfession("Программист", "Основная рекомендация"),
  match: 85,
  others: [
    { profession: makeProfession("Дизайнер", "Альтернативная рекомендация"), match: 70 },
  ],
  metrics: { brightness: 120, colorVariance: 40, contrast: 60 },
};

describe("CareerResults", () => {
  test("switches the detailed recommendation without another scan", async () => {
    const user = userEvent.setup();
    render(<CareerResults result={result} />);

    expect(screen.getByRole("heading", { level: 3, name: "Программист" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Дизайнер/ }));

    expect(screen.getByRole("heading", { level: 3, name: "Дизайнер" })).toBeInTheDocument();
    expect(screen.getByText("Альтернативная рекомендация")).toBeInTheDocument();
  });
});
