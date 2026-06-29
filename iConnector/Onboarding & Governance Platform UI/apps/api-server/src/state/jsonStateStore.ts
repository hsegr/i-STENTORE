import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

type Updater<TState, TResult> = (state: TState) => TResult | Promise<TResult>;

export class JsonStateStore<TState> {
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(
    private readonly filePath: string,
    private readonly createInitialState: () => TState,
  ) {}

  async read(): Promise<TState> {
    return this.load();
  }

  async update<TResult>(updater: Updater<TState, TResult>): Promise<TResult> {
    let result!: TResult;
    this.writeQueue = this.writeQueue.then(async () => {
      const state = await this.load();
      result = await updater(state);
      await this.save(state);
    });
    await this.writeQueue;
    return result;
  }

  private async load(): Promise<TState> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      return JSON.parse(raw) as TState;
    } catch {
      return this.createInitialState();
    }
  }

  private async save(state: TState): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(state, null, 2), "utf8");
  }
}
