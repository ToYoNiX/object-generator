import pkg from "./package.json";

/**
 * This site's identity. Edit the "toyonix" field in package.json, not this file: the root site
 * reads the same field to build the shared nav, so both always agree.
 */
export const site = {
  title: pkg.toyonix.title,
  description: pkg.toyonix.description,
};
