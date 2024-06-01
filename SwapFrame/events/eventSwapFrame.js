const id = "FO_EVENT_SWAP_TILES_FRAME";
const groups = ["Tiles"];
const name = "Swap Tiles Frame";

const MAX_TILES = 50;
let initFade = false;

// conditions:
const advancedView = {
  key: "tabs",
  in: ["advanced"],
};
const defaultView = {
  key: "tabs",
  in: ["default"],
};

function collapseView(index) {
  return {
    key: `collapseTile${index}`,
    ne: true
  };
}

function itemView(index) {
  return {
    key: "items",
    gte: index,
  };
}

const fields = [
  // Tabs
  {
    key: "tabs",
    type: "tabs",
    defaultValue: "default",
      values: {
        default: "Default",
          advanced: "Advanced Settings",
      },
  },

  {
    label: "",
  },

  // advanced view fields //
  {
    key: "init",
    label: "Swap tiles after init fade",
    type: "checkbox",
        default: false,
          conditions: [advancedView],
  },

  {
    key: "override",
    label: "Override referencing and manually input fields",
    type: "checkbox",
        default: false,
          conditions: [advancedView],
  },

  {
    key: "references",
    label: "Add reference to tileset manually:",
    type: "references",
    conditions: [advancedView],
  },

  {
    key: "_tileset",
    label: "Copy and paste the above reference (e.x. ___bank_bg_name_tileset, _bg_name_tileset)",
    type: "text",
    defaultValue: "",
      flexBasis: "100%",
      conditions: [advancedView],
  },

  {
    key: "tileLength",
    label: "Length Of Tilemap (if not 160px)",
    description: "How many tiles your tilemap has in the X axis",
    type: "number",
    unitsDefault: "tiles",
    min: 0,
    width: "50%",
    defaultValue: 20,
      conditions: [advancedView],
  },

  // default view fields //
  {
    key: "tilemapName",
    label: "Tilemap",
    description: "The tilemap you want to swap tiles with",
    type: "background",
    flexBasis: "100%",
    conditions: [defaultView],
  },

  {
    key: "frames",
    label: "Frames of animation",
    description: "How many frames the animation has. Choose 1 for a one time tileswap.",
    type: "number",
    min: 1,
    width: "50%",
    defaultValue: 1,
      conditions: [defaultView],
  },

  {
    key: "wait",
    label: "Frames between swaps if animating",
    type: "number",
    min: 0,
    width: "50%",
    defaultValue: 0,
      conditions: [defaultView],
  },

  {
    type: "break",
    conditions: [defaultView],
  },

  {
    key: "items",
    label: "Number of tiles to be swapped",
    description: "How many unique tiles to be swapped in one loop",
    type: "number",
    min: 1,
    max: MAX_TILES,
    defaultValue: 1,
      conditions: [defaultView],
  },

  {
    key: "startX",
    label: "Start X",
    type: "number",
    min: 0,
    defaultValue: 0,
      conditions: [defaultView],
  },

  {
    key: "startY",
    label: "Start Y",
    type: "number",
    min: 0,
    defaultValue: 0,
      conditions: [defaultView],
  },

  {
    key: "width",
    label: "Width",
    type: "number",
    min: 1,
    defaultValue: 1,
      conditions: [defaultView],
  },

  {
    key: "height",
    label: "Height",
    type: "number",
    min: 1,
    defaultValue: 1,
      conditions: [defaultView],
  },

];

const compile = (input, helpers) => {
  const {
    appendRaw,
    compileReferencedAssets,
    _addComment,
    variableFromUnion,
    getVariableAlias,
    temporaryEntityVariable,
    wait,
    warnings,
    backgrounds
  } = helpers;

  if (!input.tilemapName) warnings("Did you remember to set the tilemap?");
  const bg = backgrounds.find((background) => background.id === input.tilemapName);
  const tilemap = bg.symbol;

  const skipRow = input.tileLength == null ? bg.width : input.tileLength;
  const frames = input.frames;
  const startX = input.startX;
  const startY = input.startY;
  const width = input.width;
  const height = input.height;
  const endX = startX + width;
  const endY = startY + height;
  const overrideTileset = input.override ? true : false;
  initFade = input.init ? true : false;
  const replaceTile = overrideTileset ?
  `VM_REPLACE_TILE .TILEID, ${input._tileset}, .SWAPID, 1`
  : `VM_REPLACE_TILE .TILEID, ___bank_${tilemap}_tileset, _${tilemap}_tileset, .SWAPID, 1`;

  if (overrideTileset && (input._tileset == null || input._tileset === ""))
    warnings("Override is set but bank and tilesheet field is blank!\n" + replaceTile);

  if (input.references) {
    compileReferencedAssets(input.references);
  }

  _addComment("Swap Tiles");

  appendRaw(`
  VM_PUSH_CONST 0 \n .SWAPX  = .ARG5
  VM_PUSH_CONST 0 \n .SWAPY  = .ARG4
  VM_PUSH_CONST 0 \n .TILEX  = .ARG3
  VM_PUSH_CONST 0 \n .TILEY  = .ARG2
  VM_PUSH_CONST 0 \n .TILEID = .ARG1
  VM_PUSH_CONST 0 \n .SWAPID = .ARG0`
  );

  for (let i = 0; i < frames; i++) {

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        appendRaw(`VM_SET_CONST .TILEX, ${x}`);
        appendRaw(`VM_SET_CONST .TILEY, ${y}`);

        appendRaw(`VM_GET_TILE_XY .TILEID, .TILEX, .TILEY`);

        const swapX = x % skipRow;
        const swapY = y % skipRow;

        appendRaw(`VM_SET_CONST .SWAPID, ${(swapY * skipRow + swapX) + (1 * i)}`);

        appendRaw(replaceTile);
      }
    }

    if (input.wait != 0) {
      wait(input.wait);
    }
  }

  appendRaw(`VM_POP 6`);
};

module.exports = {
  id,
  name,
  groups,
  fields,
  compile,
  waitUntilAfterInitFade: initFade,
};
