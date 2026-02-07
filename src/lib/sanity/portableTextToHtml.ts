import { getImageDimensions, getImageSrcSet, getImageUrl } from "./image";
import { resolveLink } from "../routing/resolveLink";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function groupListItems(blocks: any[]): any[] {
  const grouped: any[] = [];
  let currentList: { type: "bullet" | "number"; items: any[] } | null = null;

  for (const block of blocks) {
    if (block._type === "block" && block.listItem) {
      const listType = block.listItem === "bullet" ? "bullet" : "number";

      if (currentList && currentList.type === listType) {
        currentList.items.push(block);
      } else {
        if (currentList) {
          grouped.push(currentList);
        }
        currentList = { type: listType, items: [block] };
      }
    } else {
      if (currentList) {
        grouped.push(currentList);
        currentList = null;
      }
      grouped.push(block);
    }
  }

  if (currentList) {
    grouped.push(currentList);
  }

  return grouped;
}

function renderChildren(children: any[], markDefs: any[] = []): string {
  return children
    .map((child) => {
      if (child._type === "span") {
        let text = escapeHtml(child.text || "");
        const marks = child.marks || [];

        if (marks.includes("strong")) text = `<strong>${text}</strong>`;
        if (marks.includes("em")) text = `<em>${text}</em>`;
        if (marks.includes("underline")) text = `<u>${text}</u>`;
        if (marks.includes("code")) text = `<code>${text}</code>`;
        if (marks.includes("strike-through")) text = `<del>${text}</del>`;

        for (const mark of marks) {
          const markDef = markDefs.find((def) => def._key === mark);
          if (markDef && markDef._type === "link") {
            const href = resolveLink(markDef) || markDef.href || "#";
            const isExternal = href.startsWith("http");
            const target = markDef.blank || isExternal ? "_blank" : undefined;
            const rel = target === "_blank" ? "noopener noreferrer" : undefined;

            text = `<a href="${escapeHtml(href)}"${target ? ` target="${target}"` : ""}${rel ? ` rel="${rel}"` : ""}>${text}</a>`;
          }
        }

        return text;
      }

      if (child._type === "image" && child.asset) {
        const imageUrl = getImageUrl(child, 400);
        const alt = child.alt || "";
        return `<img src="${imageUrl}" alt="${escapeHtml(alt)}" class="inline-image" loading="lazy" decoding="async" />`;
      }

      return "";
    })
    .join("");
}

export function portableTextToHtml(blocks?: any[]): string {
  if (!blocks || !Array.isArray(blocks)) return "";

  const grouped = groupListItems(blocks);

  return grouped
    .map((item) => {
      if (item.type === "bullet" || item.type === "number") {
        const tag = item.type === "bullet" ? "ul" : "ol";
        const listItems = item.items
          .map((block: any) => {
            const children = renderChildren(block.children || [], block.markDefs || []);
            return `<li>${children}</li>`;
          })
          .join("\n");
        return `<${tag}>${listItems}</${tag}>`;
      }

      const block = item;

      if (block._type === "block") {
        const style = block.style || "normal";
        const children = renderChildren(block.children || [], block.markDefs || []);

        switch (style) {
          case "h1":
            return `<h1>${children}</h1>`;
          case "h2":
            return `<h2>${children}</h2>`;
          case "h3":
            return `<h3>${children}</h3>`;
          case "h4":
            return `<h4>${children}</h4>`;
          case "h5":
            return `<h5>${children}</h5>`;
          case "h6":
            return `<h6>${children}</h6>`;
          case "blockquote":
            return `<blockquote>${children}</blockquote>`;
          default:
            return `<p>${children}</p>`;
        }
      }

      if (block._type === "image" && block.asset) {
        const imageUrl = getImageUrl(block, 800);
        const srcSet = getImageSrcSet(block, [400, 800, 1200], 80);
        const dims = getImageDimensions(block);
        const alt = block.alt || "";
        const caption = block.caption || "";

        return `
          <figure class="my-6">
            <img src="${imageUrl}" srcset="${srcSet}" sizes="100vw" alt="${escapeHtml(alt)}"${dims ? ` width="${dims.width}" height="${dims.height}"` : ""} class="rounded-lg" loading="lazy" decoding="async" />
            ${caption ? `<figcaption class="mt-2 text-sm text-gray-600 text-center">${escapeHtml(caption)}</figcaption>` : ""}
          </figure>
        `;
      }

      return "";
    })
    .join("\n");
}
