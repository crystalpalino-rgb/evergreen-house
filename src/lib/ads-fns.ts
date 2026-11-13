// The public server function behind the head injection point.
//
// The root route calls this on every server render. It answers with the exact
// script tags to put in the document head - an empty list when nothing is saved,
// when the saved value no longer parses, or when the settings cannot be read at
// all. It never throws, so it can never take a page down.

import { createServerFn } from "@tanstack/react-start";
import type { HeadScript } from "./head-snippet";
import { getHeadScriptsForRender } from "./site-settings";

export const getHeadScripts = createServerFn({ method: "GET" }).handler(
  async (): Promise<HeadScript[]> => getHeadScriptsForRender(),
);
