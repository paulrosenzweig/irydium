import { toMarkdown } from "mdast-util-to-markdown";
import { frontmatterToMarkdown } from "mdast-util-frontmatter";
import { toMdast } from "hast-util-to-mdast";

import { compile as mdsvexCompile } from "mdsvex/dist/browser-es.js";
import { codeExtractor, codeInserter, frontMatterExtractor } from "./plugins";

export async function mdToSvx(input) {
  let state = {
    codeNodes: [],
    frontMatter: {},
    svelteCells: [],
  };
  const rootComponent = await mdsvexCompile(input, {
    remarkPlugins: [codeExtractor(state)],
    rehypePlugins: [codeInserter(state)],
    frontmatter: {
      parse: frontMatterExtractor(state),
      marker: "-",
      type: "yaml",
    },
  });

  const subComponents = state.svelteCells.map((sc) => [
    `./${sc.id}.svelte`,
    { code: sc.body, map: "" },
  ]);

  return { rootComponent, subComponents, frontMatter: state.frontMatter };
}

export async function getProcessedSvx(input) {
  let state = {
    codeNodes: [],
    frontMatter: {},
    svelteCells: [],
  };
  let text;
  await mdsvexCompile(input, {
    remarkPlugins: [
      codeExtractor(state),
      () => (tree) => {
        text =
          toMarkdown(tree, {
            extensions: [frontmatterToMarkdown(["yaml"])],
          }) + "\n\n\n";
      },
    ],
    rehypePlugins: [
      codeInserter(state),
      () => (tree) => {
        text +=
          JSON.stringify(toMdast(tree), null, "\t") +
          "\n\n\n" +
          toMarkdown(toMdast(tree), {
            handlers: { text: (node) => node.value },
          });
        // text = toMarkdown(toMdast(tree));
      },
    ],
    frontmatter: {
      parse: frontMatterExtractor(state),
      marker: "-",
      type: "yaml",
    },
  });
  return text;
}
