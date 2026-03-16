import type { CreateProjectInput } from "@pagecraft/shared-types";

import type { LocalStoreRepository } from "@pagecraft/capture-core";

import { notFound } from "../lib/errors";

export class ProjectService {
  constructor(private readonly repository: LocalStoreRepository) {}

  async listProjects() {
    return this.repository.listProjects();
  }

  async createProject(input: CreateProjectInput) {
    return this.repository.createProject(input);
  }

  async getProject(projectId: string) {
    const project = await this.repository.getProjectDetail(projectId);
    if (!project) {
      notFound(`Project ${projectId} was not found.`);
    }

    return project;
  }

  async deleteProject(projectId: string) {
    const deleted = await this.repository.deleteProject(projectId);
    if (!deleted) {
      notFound(`Project ${projectId} was not found.`);
    }

    return { deleted: true };
  }

  async listPages(projectId: string) {
    return this.repository.listPages(projectId);
  }

  async getPage(pageId: string) {
    const page = await this.repository.getPageDetail(pageId);
    if (!page) {
      notFound(`Page ${pageId} was not found.`);
    }

    return page;
  }

  async getNormalized(pageId: string) {
    const page = await this.getPage(pageId);
    return page.capture;
  }

  async listStyles(projectId: string) {
    return this.repository.listStyles(projectId);
  }

  async listPatterns(projectId: string) {
    return this.repository.listPatterns(projectId);
  }

  async listWarnings(projectId: string) {
    return this.repository.listWarnings(projectId);
  }

  async listJobs(projectId: string) {
    return this.repository.listJobs(projectId);
  }

  async getJob(jobId: string) {
    const job = await this.repository.getJob(jobId);
    if (!job) {
      notFound(`Job ${jobId} was not found.`);
    }

    return job;
  }

  async buildProjectExport(projectId: string) {
    const bundle = await this.repository.buildProjectExport(projectId);
    if (!bundle) {
      notFound(`Project ${projectId} was not found.`);
    }

    return bundle;
  }

  async buildPageExport(pageId: string) {
    const bundle = await this.repository.buildPageExport(pageId);
    if (!bundle) {
      notFound(`Page ${pageId} was not found.`);
    }

    return bundle;
  }
}
