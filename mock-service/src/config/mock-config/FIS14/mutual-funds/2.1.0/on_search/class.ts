import { readFileSync } from "fs";
import yaml from "js-yaml";
import path from "path";
import { MockAction, saveType } from "../../../../FIS14/classes/mock-action";
import { on_searchDefaultGenerator } from "./generator";

export class MockOnSearchClass extends MockAction {
  get saveData(): saveType {
    return yaml.load(
      readFileSync(path.resolve(__dirname, "./save-data.yaml"), "utf8")
    ) as saveType;
  }

  get inputs(): any {
    return {};
  }

  get defaultData(): any {
    return yaml.load(
      readFileSync(path.resolve(__dirname, "./default.yaml"), "utf8")
    );
  }

  name(): string {
    return "on_search";
  }

  get description(): string {
    return "Mock for mutual funds on_search";
  }

  async generator(existingPayload: any, sessionData: any): Promise<any> {
    return on_searchDefaultGenerator(existingPayload, sessionData);
  }

  async validate(targetPayload: any): Promise<any> {
    return { valid: true };
  }

  async meetRequirements(sessionData: any): Promise<any> {
    return { valid: true };
  }
}
