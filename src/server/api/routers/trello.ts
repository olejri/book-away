import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { trelloBoardEmails } from "~/server/db/schema";
import { sendEmail } from "~/server/email";

/** Max size per attachment, measured on the decoded (raw) bytes. */
const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024; // 4 MB
const MAX_ATTACHMENTS = 3;
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

const attachmentSchema = z.object({
  filename: z.string().min(1).max(200),
  contentType: z.enum(ALLOWED_IMAGE_TYPES),
  /** Base64-encoded image bytes (no data-URL prefix). */
  dataBase64: z.string().min(1),
});

export const trelloRouter = createTRPCRouter({
  createCard: protectedProcedure
    .input(
      z.object({
        boardEmailId: z.string(),
        title: z.string().min(1, "Card title cannot be empty").max(500),
        description: z.string().max(2000).optional(),
        attachments: z.array(attachmentSchema).max(MAX_ATTACHMENTS).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const board = await ctx.db.query.trelloBoardEmails.findFirst({
        where: eq(trelloBoardEmails.id, input.boardEmailId),
      });

      if (!board || board.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Board not found. Please select a valid board in Settings.",
        });
      }

      // Validate decoded size of each attachment (zod only checks the string).
      for (const a of input.attachments ?? []) {
        const sizeBytes = Math.floor((a.dataBase64.length * 3) / 4);
        if (sizeBytes > MAX_ATTACHMENT_BYTES) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `"${a.filename}" is too large. Please use an image under 4 MB.`,
          });
        }
      }

      const result = await sendEmail({
        to: board.email,
        subject: input.title,
        body: input.description ?? input.title,
        attachments: input.attachments?.map((a) => ({
          filename: a.filename,
          contentBase64: a.dataBase64,
        })),
      });

      return { success: true, messageId: result?.id ?? null };
    }),
});
