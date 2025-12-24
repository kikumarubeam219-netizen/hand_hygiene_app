import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { generatePDFBuffer } from "./pdf_generator";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
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

  // PDF生成エンドポイント
  generatePDF: publicProcedure
    .input(
      z.object({
        facilityInfo: z.object({
          facilityName: z.string(),
          department: z.string(),
          ward: z.string(),
          section: z.string(),
          periodNumber: z.string(),
          date: z.string(),
          sessionNumber: z.string(),
          observer: z.string(),
          pageNumber: z.string(),
          address: z.string(),
        }),
        records: z.array(
          z.object({
            timestamp: z.number(),
            timing: z.number(),
            action: z.string(),
            notes: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      try {
        console.log('[API] PDF generation request received');
        
        const pdfBuffer = await generatePDFBuffer(
          input.facilityInfo,
          input.records
        );

        console.log('[API] PDF generated successfully, size:', pdfBuffer.length);

        return {
          success: true,
          size: pdfBuffer.length,
          // Base64エンコードして返す
          data: pdfBuffer.toString('base64'),
        };
      } catch (error) {
        console.error('[API] PDF generation error:', error);
        throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),
});

export type AppRouter = typeof appRouter;
