import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { JobList } from "../components/job-list";

describe("JobList", () => {
  it("renders an empty state when no jobs are present", () => {
    render(<JobList jobs={[]} />);
    expect(screen.getByText("No jobs yet. Start a page capture or crawl to populate project activity.")).toBeInTheDocument();
  });

  it("renders job progress and status details", () => {
    render(
      <JobList
        jobs={[
          {
            id: "job_1",
            kind: "capture",
            status: "running",
            projectId: "project_1",
            pageId: "page_1",
            crawlRunId: null,
            pageUrl: "https://example.com",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            progress: 0.42,
            message: "Capturing homepage",
            errorMessage: null
          }
        ]}
      />
    );

    expect(screen.getByText("capture")).toBeInTheDocument();
    expect(screen.getByText("Capturing homepage")).toBeInTheDocument();
    expect(screen.getByText("42%")).toBeInTheDocument();
    expect(screen.getByText("running")).toBeInTheDocument();
  });
});
