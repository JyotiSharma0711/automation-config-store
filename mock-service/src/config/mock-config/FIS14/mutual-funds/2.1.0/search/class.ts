import { readFileSync } from "fs";
import yaml from "js-yaml";
import path from "path";
import { MockAction, saveType } from "../../../../FIS14/classes/mock-action";
import { searchDefaultGenerator } from "./generator";

export class MockSearchClass extends MockAction {
  get saveData(): saveType {
    return yaml.load(
      readFileSync(path.resolve(__dirname, "./save-data.yaml"), "utf8")
    ) as saveType;
  }

  get inputs(): any {
    return {
      city_code: {
        name: "Enter city code",
        label: "Enter city code",
        type: "text",
        payloadField: "$.context.location.city.code"
      }
    };
  }

  get defaultData(): any {
    return yaml.load(
      readFileSync(path.resolve(__dirname, "./default.yaml"), "utf8")
    );
  }

  name(): string {
    return "search";
  }

  get description(): string {
    return "Mock for mutual funds search";
  }

  async generator(existingPayload: any, sessionData: any): Promise<any> {
    return searchDefaultGenerator(existingPayload, sessionData);
  }

  async validate(targetPayload: any): Promise<any> {
    return { valid: true };
  }

  async meetRequirements(sessionData: any): Promise<any> {
    if (!sessionData.transaction_id) {
      return {
        valid: false,
        message: "No transaction_id available in session data"
      };
    }
    return { valid: true };
  }
}
