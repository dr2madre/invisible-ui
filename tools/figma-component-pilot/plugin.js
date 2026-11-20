/* global figma, CARD_LAYOUT, BUTTON_STYLES, BUTTON_APPEARANCE, TOKEN_PAYLOAD, TOKEN_INFO, __html__ */
import { generatedTarget, updateGeneratedBoard } from "./sync.js";
import { updateTokenVariables } from "./tokens.js";
import { buttonPaint, verifyButtonColors } from "./button-colors.js";

const COLLECTION_NAME = "Invisible UI";
const EXPORT_KEY = "invisible-ui-component-pilot";

const FONT_REGULAR = { family: "Inter", style: "Regular" };
const FONT_MEDIUM = { family: "Inter", style: "Medium" };
const FONT_SEMIBOLD = { family: "Inter", style: "Semi Bold" };

let variables = new Map();
let generatedNodes = [];

function remember(node) {
  generatedNodes.push(node);
  return node;
}

function removeGeneratedNodes() {
  for (const node of generatedNodes) {
    if (!node.removed) node.remove();
  }
  generatedNodes = [];
}

function rgb(hex) {
  const digits = hex.replace("#", "");
  return {
    r: Number.parseInt(digits.slice(0, 2), 16) / 255,
    g: Number.parseInt(digits.slice(2, 4), 16) / 255,
    b: Number.parseInt(digits.slice(4, 6), 16) / 255,
  };
}

function solid(hex, opacity = 1) {
  return { type: "SOLID", color: rgb(hex), opacity };
}

function paintFor(variableName, fallback, opacity = 1) {
  const paint = solid(fallback, opacity);
  const variable = variables.get(variableName);
  return variable ? figma.variables.setBoundVariableForPaint(paint, "color", variable) : paint;
}

function fill(node, variableName, fallback, opacity = 1) {
  node.fills = [paintFor(variableName, fallback, opacity)];
}

function stroke(node, variableName, fallback) {
  node.strokes = [paintFor(variableName, fallback)];
  node.strokeWeight = 1;
  node.strokeAlign = "INSIDE";
}

function radius(node, variableName, fallback) {
  node.cornerRadius = fallback;
  const variable = variables.get(variableName);
  if (variable) node.setBoundVariable("cornerRadius", variable);
}

function auto(node, direction, gap = 0) {
  node.layoutMode = direction;
  node.primaryAxisSizingMode = "AUTO";
  node.counterAxisSizingMode = "AUTO";
  node.itemSpacing = gap;
}

function pad(node, vertical, horizontal = vertical) {
  node.paddingTop = vertical;
  node.paddingBottom = vertical;
  node.paddingLeft = horizontal;
  node.paddingRight = horizontal;
}

function text(value, options = {}) {
  const node = remember(figma.createText());
  node.fontName = options.font ?? FONT_REGULAR;
  node.characters = value;
  node.fontSize = options.size ?? 14;
  node.lineHeight = { unit: "AUTO" };
  fill(
    node,
    options.color ?? "components/general/foreground/default",
    options.fallback ?? "#272727",
  );
  return node;
}

function title(value) {
  return text(value, { font: FONT_SEMIBOLD, size: 20 });
}

function group(label) {
  const frame = remember(figma.createFrame());
  frame.name = label;
  auto(frame, "VERTICAL", 16);
  frame.fills = [];
  frame.appendChild(title(label));
  const row = remember(figma.createFrame());
  row.name = `${label} examples`;
  auto(row, "HORIZONTAL", 24);
  row.fills = [];
  frame.appendChild(row);
  return { frame, row };
}

function component(name, source) {
  const node = remember(figma.createComponent());
  node.name = name;
  node.setPluginData("invisible-ui-source", source);
  node.setPluginData("invisible-ui-export", EXPORT_KEY);
  return node;
}

function componentSet(name, source, components, columns) {
  const set = remember(figma.combineAsVariants(components, components[0].parent));
  set.name = name;
  set.description = `Generated from ${source}.`;
  set.setPluginData("invisible-ui-source", source);
  set.setPluginData("invisible-ui-export", EXPORT_KEY);
  set.fills = [];
  set.strokes = [];

  const gap = 24;
  const padding = 24;
  const rows = Math.ceil(components.length / columns);
  const columnWidths = Array.from({ length: columns }, () => 0);
  const rowHeights = Array.from({ length: rows }, () => 0);

  components.forEach((item, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    columnWidths[column] = Math.max(columnWidths[column], item.width);
    rowHeights[row] = Math.max(rowHeights[row], item.height);
  });

  const columnOffsets = columnWidths.map((_, index) =>
    columnWidths.slice(0, index).reduce((sum, width) => sum + width + gap, padding),
  );
  const rowOffsets = rowHeights.map((_, index) =>
    rowHeights.slice(0, index).reduce((sum, height) => sum + height + gap, padding),
  );

  components.forEach((item, index) => {
    item.x = columnOffsets[index % columns];
    item.y = rowOffsets[Math.floor(index / columns)];
  });

  const width = columnWidths.reduce((sum, value) => sum + value, padding * 2 + gap * (columns - 1));
  const height = rowHeights.reduce((sum, value) => sum + value, padding * 2 + gap * (rows - 1));
  set.resizeWithoutConstraints(width, height);
  return set;
}

function addIcon(parent, colorName, fallback, glyph = "+") {
  const icon = text(glyph, { font: FONT_MEDIUM, size: 16, color: colorName, fallback });
  icon.name = "Icon";
  parent.appendChild(icon);
}

function createButton(variant, state) {
  const node = component(
    `Variant=${variant}, State=${state}`,
    "packages/svelte/src/lib/button/Button.svelte",
  );
  auto(node, "HORIZONTAL", 8);
  pad(node, 8, 14);
  node.counterAxisAlignItems = "CENTER";
  node.primaryAxisAlignItems = "CENTER";
  node.minHeight = 36;
  const paint = (property) =>
    buttonPaint(variant, state, property, BUTTON_STYLES, variables, (value, field, variable) =>
      figma.variables.setBoundVariableForPaint(value, field, variable),
    );
  node.opacity = state === "Disabled" ? BUTTON_STYLES.disabledOpacity : 1;
  radius(node, "metrics/radius/control", 8);

  node.fills = [paint("background")];
  node.strokes = [paint("border")];
  node.strokeWeight = BUTTON_STYLES.borderWidth;
  node.strokeAlign = "INSIDE";

  if (variant === "Danger") {
    addIcon(node, "components/general/foreground/default", "#000000", "!");
    node.children[0].fills = [paint("foreground")];
  }
  const label = text(variant, {
    font: FONT_MEDIUM,
  });
  label.fills = [paint("foreground")];
  label.textDecoration = BUTTON_STYLES.underline.includes(variant.toLowerCase())
    ? "UNDERLINE"
    : "NONE";
  label.name = "Label";
  node.appendChild(label);
  return node;
}

function createField(state) {
  const node = component(`State=${state}`, "packages/svelte/src/lib/text-field/TextField.svelte");
  auto(node, "VERTICAL", 6);
  node.resize(288, 100);
  node.counterAxisSizingMode = "FIXED";
  node.fills = [];

  const label = text("Label", { font: FONT_SEMIBOLD, size: 14 });
  label.name = "Label";
  if (state === "Disabled") {
    fill(label, "components/general/foreground/disabled", "#757575");
  }
  node.appendChild(label);

  const control = remember(figma.createFrame());
  control.name = "Control";
  auto(control, "HORIZONTAL", 8);
  control.counterAxisSizingMode = "FIXED";
  control.primaryAxisSizingMode = "FIXED";
  control.resize(288, 40);
  control.counterAxisAlignItems = "CENTER";
  pad(control, 8, 12);
  fill(control, "components/general/background/default", "#FFFFFF");
  radius(control, "metrics/radius/control", 8);
  const border =
    state === "Error"
      ? ["components/general/feedback/danger/solid/background/default", "#BE3B50"]
      : state === "Focus"
        ? ["components/general/focus/ring/color", "#8E6CD4"]
        : ["components/general/border/control", "#757575"];
  stroke(control, ...border);
  if (state === "Focus") {
    control.effects = [
      {
        type: "DROP_SHADOW",
        color: { ...rgb("#8E6CD4"), a: 0.3 },
        offset: { x: 0, y: 0 },
        radius: 3,
        spread: 2,
        visible: true,
        blendMode: "NORMAL",
      },
    ];
  }
  const value = text(state === "Default" ? "Placeholder" : "Entered value", {
    color:
      state === "Default"
        ? "components/general/foreground/secondary"
        : "components/general/foreground/default",
    fallback: state === "Default" ? "#515151" : "#272727",
  });
  value.name = "Value";
  if (state === "Disabled") fill(value, "components/general/foreground/disabled", "#757575");
  control.appendChild(value);
  node.appendChild(control);

  const messages = {
    Default: ["Helpful description", "components/general/foreground/secondary", "#515151"],
    Focus: ["Helpful description", "components/general/foreground/secondary", "#515151"],
    Error: [
      "Error message",
      "components/general/feedback/danger/body/foreground/default",
      "#BE3B50",
    ],
    Success: [
      "Value confirmed",
      "components/general/feedback/success/body/foreground/default",
      "#3E7523",
    ],
    Disabled: ["Unavailable", "components/general/foreground/disabled", "#757575"],
  };
  const [message, color, fallback] = messages[state];
  const caption = text(message, { size: 13, color, fallback });
  caption.name = state === "Error" ? "Error" : state === "Success" ? "Success" : "Description";
  node.appendChild(caption);
  return node;
}

function cardShell(name) {
  const node = component(name, "packages/svelte/src/lib/card/Card.svelte");
  fill(node, "components/card/background/default", "#FFFFFF");
  stroke(node, "components/general/border/default", "#BDBDBD");
  radius(node, "metrics/radius/container", 12);
  node.clipsContent = true;
  return node;
}

function cardBody(width = 320) {
  const body = remember(figma.createFrame());
  body.name = "Body";
  auto(body, "VERTICAL", CARD_LAYOUT.body.gap);
  body.counterAxisSizingMode = "FIXED";
  body.resize(width, 110);
  pad(body, CARD_LAYOUT.body.padding);
  body.fills = [];
  body.appendChild(text("Card title", { font: FONT_SEMIBOLD, size: 17 }));
  const description = text("Supporting content from the component description.", {
    color: "components/general/foreground/secondary",
    fallback: "#515151",
  });
  description.textAutoResize = "HEIGHT";
  description.resize(width - CARD_LAYOUT.body.padding * 2, 40);
  body.appendChild(description);
  description.layoutAlign = "STRETCH";
  return body;
}

function mediaPlaceholder(width, height) {
  const media = remember(figma.createFrame());
  media.name = "Media";
  fill(media, "components/general/feedback/neutral/background/default", "#F5F5F5");
  media.layoutMode = "HORIZONTAL";
  // Enabling auto layout defaults to hug, which would collapse the media to its label.
  media.primaryAxisSizingMode = "FIXED";
  media.counterAxisSizingMode = "FIXED";
  media.resize(width, height);
  media.primaryAxisAlignItems = CARD_LAYOUT.media.justify;
  media.counterAxisAlignItems = CARD_LAYOUT.media.align;
  media.appendChild(
    text("Media", {
      font: FONT_MEDIUM,
      color: "components/general/foreground/secondary",
      fallback: "#515151",
    }),
  );
  return media;
}

function createVerticalCard() {
  const node = cardShell("Variant=Media, Orientation=Vertical");
  auto(node, CARD_LAYOUT.vertical.direction);
  node.resizeWithoutConstraints(320, node.height);
  node.counterAxisSizingMode = "FIXED";
  const media = mediaPlaceholder(320, 140);
  const body = cardBody();
  node.appendChild(media);
  node.appendChild(body);
  media.layoutAlign = CARD_LAYOUT.vertical.mediaAlign;
  body.layoutAlign = "STRETCH";
  return node;
}

function createHorizontalCard() {
  const node = cardShell("Variant=Media, Orientation=Horizontal");
  auto(node, CARD_LAYOUT.horizontal.direction);
  node.counterAxisAlignItems = "MIN";
  const media = mediaPlaceholder(CARD_LAYOUT.horizontal.mediaWidth, 150);
  const body = cardBody(300);
  node.appendChild(media);
  node.appendChild(body);
  // The body determines the card height; media fills it while keeping its width.
  media.layoutAlign = CARD_LAYOUT.horizontal.mediaAlign;
  return node;
}

function createDashboardCard() {
  const node = cardShell("Variant=Dashboard, Orientation=None");
  auto(node, "VERTICAL", 20);
  pad(node, 18);
  node.resize(300, 140);
  node.appendChild(text("Monthly activity", { font: FONT_SEMIBOLD, size: 15 }));
  const metric = remember(figma.createFrame());
  metric.name = "Metric";
  auto(metric, "HORIZONTAL", 8);
  metric.counterAxisAlignItems = "BASELINE";
  metric.fills = [];
  metric.appendChild(text("1,284", { font: FONT_SEMIBOLD, size: 30 }));
  metric.appendChild(
    text("+12%", {
      font: FONT_MEDIUM,
      color: "components/general/feedback/success/body/foreground/default",
      fallback: "#3E7523",
    }),
  );
  node.appendChild(metric);
  return node;
}

async function localVariables() {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const collection = collections.find((item) => item.name === COLLECTION_NAME);
  if (!collection) throw new Error(`Variable collection "${COLLECTION_NAME}" was not found.`);
  const all = await figma.variables.getLocalVariablesAsync();
  return new Map(
    all
      .filter((variable) => variable.variableCollectionId === collection.id)
      .map((variable) => [variable.name, variable]),
  );
}

async function main() {
  await Promise.all([
    figma.loadFontAsync(FONT_REGULAR),
    figma.loadFontAsync(FONT_MEDIUM),
    figma.loadFontAsync(FONT_SEMIBOLD),
  ]);
  variables = await localVariables();
  const collection = (await figma.variables.getLocalVariableCollectionsAsync()).find(
    (item) => item.name === COLLECTION_NAME,
  );

  const page = figma.currentPage;
  const target = generatedTarget(EXPORT_KEY);
  generatedNodes = [];

  try {
    const board = remember(figma.createFrame());
    board.visible = !target;
    board.name = "Invisible UI component pilot";
    auto(board, "VERTICAL", 48);
    pad(board, 48);
    fill(board, "components/general/background/default", "#FFFFFF");
    board.appendChild(title("Invisible UI component pilot"));
    board.appendChild(
      text(
        "Editable component structures generated from the Svelte contracts and connected to shared variables.",
        {
          color: "components/general/foreground/secondary",
          fallback: "#515151",
        },
      ),
    );

    const buttons = group("Button");
    const buttonComponents = [];
    for (const variant of ["Default", "Primary", "Secondary", "Ghost", "Danger"]) {
      for (const state of ["Default", "Hover", "Disabled"]) {
        const item = createButton(variant, state);
        buttons.row.appendChild(item);
        buttonComponents.push(item);
      }
    }
    componentSet("Button", "packages/svelte/src/lib/button/Button.svelte", buttonComponents, 3);
    board.appendChild(buttons.frame);

    const fields = group("Text Field");
    const fieldComponents = [];
    for (const state of ["Default", "Focus", "Error", "Success", "Disabled"]) {
      const item = createField(state);
      fields.row.appendChild(item);
      fieldComponents.push(item);
    }
    componentSet(
      "Text Field",
      "packages/svelte/src/lib/text-field/TextField.svelte",
      fieldComponents,
      5,
    );
    board.appendChild(fields.frame);

    const cards = group("Card");
    const cardComponents = [createVerticalCard(), createHorizontalCard(), createDashboardCard()];
    for (const item of cardComponents) cards.row.appendChild(item);
    componentSet("Card", "packages/svelte/src/lib/card/Card.svelte", cardComponents, 3);
    board.appendChild(cards.frame);

    board.setPluginData("invisible-ui-export", EXPORT_KEY);
    page.appendChild(board);
    if (target) {
      await updateGeneratedBoard(target.board, board, () =>
        verifyButtonColors(target.board, BUTTON_APPEARANCE, variables, collection, BUTTON_STYLES),
      );
      removeGeneratedNodes();
      if (target.page === page) {
        page.selection = [target.board];
        figma.viewport.scrollAndZoomIntoView([target.board]);
      }
      figma.closePlugin(
        `Updated 3 component sets on ${target.page.name}. Button colours verified in Light and Dark.`,
      );
    } else {
      verifyButtonColors(board, BUTTON_APPEARANCE, variables, collection, BUTTON_STYLES);
      generatedNodes = [];
      figma.currentPage.selection = [board];
      figma.viewport.scrollAndZoomIntoView([board]);
      figma.closePlugin(`Created 3 component sets with 23 variants on ${page.name}.`);
    }
  } catch (error) {
    removeGeneratedNodes();
    throw error;
  }
}

figma.showUI(__html__, { width: 380, height: 440, themeColors: true });
let running = false;
figma.ui.onmessage = async (message) => {
  if (running || !message) return;
  if (message.type === "ready") {
    figma.ui.postMessage({ type: "token-info", ...TOKEN_INFO });
    return;
  }
  if (message.type === "cancel") {
    figma.closePlugin();
    return;
  }
  if (message.type !== "update" || typeof message.includeTokens !== "boolean") return;
  running = true;
  let tokensUpdated = false;
  try {
    if (message.includeTokens) {
      await updateTokenVariables(TOKEN_PAYLOAD, COLLECTION_NAME);
      tokensUpdated = true;
    }
    await main();
  } catch (error) {
    console.error(error);
    figma.ui.postMessage({
      type: "error",
      message: `${tokensUpdated ? "Tokens updated; component update failed. " : ""}${error instanceof Error ? error.message : "Update failed."}`,
    });
  } finally {
    running = false;
  }
};
