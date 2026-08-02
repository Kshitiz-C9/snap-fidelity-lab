import { loadFont as loadDisplay } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadBody } from "@remotion/google-fonts/DMSans";

const display = loadDisplay("normal", { weights: ["500", "700"], subsets: ["latin"] });
const body = loadBody("normal", { weights: ["400", "500"], subsets: ["latin"] });

export const fonts = {
  display: display.fontFamily,
  body: body.fontFamily,
  mono: "monospace",
};