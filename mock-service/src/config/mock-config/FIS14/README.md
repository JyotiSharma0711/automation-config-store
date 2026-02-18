# FIS14 Mutual Funds Mock Implementation

**NOTE**: Due to time constraints, the mock class files need to be created. Each action directory (search, on_search, select, on_select, select_2, on_select_2, init, on_init, confirm, on_confirm, on_status_unsolicited, on_update_unsolicited) requires a `class.ts` file.

## Template for Creating Mock Classes

Use this template for each action's `class.ts` file:

```typescript
import { readFileSync } from "fs";
import yaml from "js-yaml";
import path from "path";
import { MockAction } from "../../../../FIS12/classes/mock-action";
import { SessionData } from "../../../session-types";

export class Mock[ActionName]Class extends MockAction {
  get defaultData(): any {
    return yaml.load(
      readFileSync(path.resolve(__dirname, "./default.yaml"), "utf8")
    );
  }

  name(): string {
    return "[action_name]";
  }

  get description(): string {
    return "Mock for [action description]";
  }

  async generator(existingPayload: any, sessionData: SessionData): Promise<any> {
    return this.defaultData;
  }

  async validate(targetPayload: any): Promise<any> {
    return { valid: true };
  }

  async meetRequirements(sessionData: SessionData): Promise<any> {
    return { valid: true };
  }
}
```

## Actions Needing Class Files

1. `search/class.ts` - MockSearchClass
2. `on_search/class.ts` - MockOnSearchClass
3. `select/class.ts` - MockSelectClass
4. `on_select/class.ts` - MockOnSelectClass
5. `select_2/class.ts` - MockSelect2Class
6. `on_select_2/class.ts` - MockOnSelect2Class
7. `init/class.ts` - MockInitClass
8. `on_init/class.ts` - MockOnInitClass
9. `confirm/class.ts` - MockConfirmClass
10. `on_confirm/class.ts` - MockOnConfirmClass
11. `on_status_unsolicited/class.ts` - MockOnStatusUnsolicitedClass
12. `on_update_unsolicited/class.ts` - MockOnUpdateUnsolicitedClass

All `default.yaml` files are already created in each directory.
