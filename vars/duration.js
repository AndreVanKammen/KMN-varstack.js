import { BaseDefinition } from "./base.js";
import { TimeVar } from "./time.js";

// Duration is a special case for a time var
// TODO: Add a string function that handles days like 3d 10 min 5 seconds or something like that
class DurationVar extends TimeVar {
}

DurationVar.typeDefinition = new BaseDefinition();
DurationVar.typeDefinition.type = 'Duration';

export { DurationVar };
