import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusChip } from "../components/status-chip";

describe("StatusChip", () => {
  it("renders the provided status value", () => {
    render(<StatusChip value="completed" />);
    expect(screen.getByText("completed")).toBeInTheDocument();
  });
});
