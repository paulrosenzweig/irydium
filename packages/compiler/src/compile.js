import { mdToSvx, getProcessedSvx } from "./mdToSvx";
import { svxToHTML } from "./svxToHTML";

export function compile(input, options = {}) {
  if (options.mode === "mdsvex_input") {
    return getProcessedSvx(input).then((text) => ({ html: text }));
  }
  return mdToSvx(input)
    .then(({ rootComponent, subComponents, frontMatter }) => {
      if (options.mode === "mdsvex") {
        return { html: rootComponent.code, frontMatter };
      }
      return svxToHTML(rootComponent, subComponents, frontMatter, options);
    })
    .catch((err) => {
      console.error(err);
      throw err;
    });
}
