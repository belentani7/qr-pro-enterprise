import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  MAX_PROMPT_CHARS,
  calculateContrastRatio,
  generateLocalQRPngDataUrl,
  generateMultiPartQRSVG,
  reassembleMultiQRPayloads,
} from "../lib/qr-engine";
import { generateShapeFromDescription } from "../lib/image-steganography-service";

const qrOptionsSchema = z.object({
  content: z.string().trim().min(1).max(MAX_PROMPT_CHARS),
  width: z.number().int().min(64).max(2048).optional().default(320),
  margin: z.number().int().min(1).max(10).optional().default(2),
  darkColor: z.string().optional().default("#000000"),
  lightColor: z.string().optional().default("#FFFFFF"),
  errorCorrectionLevel: z.enum(["L", "M", "Q", "H"]).optional().default("M"),
  moduleShape: z
    .enum(["square", "rounded", "circle", "diamond", "organic"])
    .optional()
    .default("square"),
  finderStyle: z.enum(["square", "rounded", "circle"]).optional(),
  logoText: z.string().max(4).optional(),
  stylePrompt: z.string().max(MAX_PROMPT_CHARS).optional(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  qr: router({
    generate: publicProcedure.input(qrOptionsSchema).mutation(async ({ input }) => {
      let darkColor = input.darkColor;
      let moduleShape = input.moduleShape;

      if (input.stylePrompt?.trim()) {
        const derived = await generateShapeFromDescription(input.stylePrompt);
        moduleShape = derived.moduleShape;
        if (darkColor === "#000000") {
          darkColor = derived.accentColor;
        }
      }

      const contrast = calculateContrastRatio(darkColor, input.lightColor);
      const multi = generateMultiPartQRSVG(input.content, {
        width: input.width,
        margin: input.margin,
        darkColor,
        lightColor: input.lightColor,
        errorCorrectionLevel: input.errorCorrectionLevel,
        moduleShape,
        finderStyle: input.finderStyle,
        logoText: input.logoText,
      });

      let pngDataUrl: string | null = null;
      if (!multi.isMultiPart && moduleShape === "square" && !input.logoText) {
        pngDataUrl = await generateLocalQRPngDataUrl(input.content, {
          width: input.width,
          margin: input.margin,
          darkColor,
          lightColor: input.lightColor,
          errorCorrectionLevel: input.errorCorrectionLevel,
        });
      }

      return {
        isMultiPart: multi.isMultiPart,
        totalChars: multi.totalChars,
        totalBytes: multi.totalBytes,
        parts: multi.parts,
        svg: multi.parts[0].svg,
        dataUrl: pngDataUrl ?? multi.parts[0].dataUrl,
        contrast,
      };
    }),
    contrast: publicProcedure
      .input(
        z.object({
          darkColor: z.string(),
          lightColor: z.string(),
        })
      )
      .query(({ input }) => calculateContrastRatio(input.darkColor, input.lightColor)),
    reassemble: publicProcedure
      .input(
        z.object({
          parts: z.array(z.string().min(1)).min(1).max(20),
        })
      )
      .query(({ input }) => ({
        content: reassembleMultiQRPayloads(input.parts),
      })),
  }),
});

export type AppRouter = typeof appRouter;
