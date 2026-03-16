import type { DevLoginInput } from "@pagecraft/shared-types";

import type { LocalStoreRepository } from "@pagecraft/capture-core";

export class AuthService {
  constructor(private readonly repository: LocalStoreRepository) {}

  async devLogin(input: DevLoginInput) {
    return this.repository.upsertDevUser(input.email, input.name);
  }

  async me() {
    return this.repository.getCurrentUser();
  }
}
