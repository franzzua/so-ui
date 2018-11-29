import {UI} from "./src/ui";
import {Container} from "@so/di";

export * from "./src/component";
export * from "./src/hyper.component";

export const init: (container: Container) => void = UI.init;

export * from "./src/helpers";
export * from './helpers/events';