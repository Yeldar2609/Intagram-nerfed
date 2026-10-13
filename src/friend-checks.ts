import { CheckUnavailable, type FriendApi } from "./friend-api";
import type { Friends } from "./friends";

type Cached = {
  readonly mutual: boolean;
  readonly until: number;
  readonly failure?: string;
};
const TTL = 5 * 60_000;
export class FriendChecks {
  private viewer: string | undefined;
  private owner: string | undefined;
  private ownerUntil = 0;
  private names: readonly string[] = [];
  private readonly cache = new Map<string, Cached>();
  private controller = new AbortController();
  private busy = false;
  private next = 0;
  private ownerNext = 0;
  private pausedUntil = 0;
  private failure: string | undefined;
  constructor(
    private readonly api: FriendApi,
    private readonly changed: () => void,
  ) {}
  update(
    viewer: string | undefined,
    names: readonly string[],
    now: number,
  ): void {
    if (viewer !== this.viewer) {
      this.controller.abort();
      this.controller = new AbortController();
      this.viewer = viewer;
      this.owner = undefined;
      this.ownerUntil = 0;
      this.cache.clear();
      this.busy = false;
      this.next = now;
      this.ownerNext = now;
      this.pausedUntil = 0;
      this.failure = undefined;
    }
    this.names = [...new Set(names)];
  }
  invalidate(name: string): void {
    this.cache.delete(name);
  }
  snapshot(now: number): Friends {
    return {
      owner: this.ownerUntil > now ? this.owner : undefined,
      mutuals: [...this.cache]
        .filter(([, value]) => value.mutual && value.until > now)
        .map(([name]) => name),
    };
  }
  status(now: number): string {
    if (!this.viewer) return "Sign in to Instagram to check mutual friends.";
    const failure =
      this.failure ??
      this.names
        .map((name) => this.cache.get(name))
        .find((value) => value && value.until > now && value.failure)?.failure;
    if (failure)
      return `Posts waiting for verification: ${failure}. Stories, messages and search still work. Retrying automatically.`;
    if (
      this.busy ||
      this.names.some(
        (name) =>
          name !== this.owner && (this.cache.get(name)?.until ?? 0) <= now,
      )
    )
      return "Checking mutual friends…";
    return "";
  }
  async tick(now: number): Promise<void> {
    if (!this.viewer || this.busy || now < this.next || now < this.pausedUntil)
      return;
    const ownerDue = now >= this.ownerNext;
    const name =
      this.names.find(
        (value) => value !== this.owner && !this.cache.has(value),
      ) ??
      this.names.find(
        (value) =>
          value !== this.owner && (this.cache.get(value)?.until ?? 0) <= now,
      );
    if (!ownerDue && !name) return;
    this.busy = true;
    this.next = now + 3000;
    const signal = this.controller.signal;
    const viewer = this.viewer;
    try {
      if (ownerDue) {
        const owner = await this.api.owner(viewer, signal);
        if (signal.aborted) return;
        this.owner = owner;
        this.ownerUntil = now + TTL;
        this.failure = undefined;
        this.ownerNext = now + TTL;
      } else if (name) {
        const result = await this.api.relationship(name, signal);
        if (signal.aborted) return;
        if (result.id === viewer) {
          this.owner = result.username;
          this.ownerUntil = now + TTL;
        }
        this.cache.set(name, { mutual: result.mutual, until: now + TTL });
        this.failure = undefined;
      }
    } catch (error) {
      if (signal.aborted) return;
      if (!(error instanceof CheckUnavailable)) throw error;
      if (error.pauseAll) this.pausedUntil = now + error.retryMs + 8000;
      this.failure = error.reason;
      if (ownerDue) this.ownerNext = now + TTL;
      else {
        if (name)
          this.cache.set(name, {
            mutual: false,
            failure: error.reason,
            until: now + Math.max(TTL, 2 * error.retryMs + 8000),
          });
      }
    } finally {
      if (!signal.aborted) {
        this.busy = false;
        this.changed();
      }
    }
  }
}
