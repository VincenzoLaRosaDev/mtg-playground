import type { PrismaClient } from "@/generated/prisma/client";

export type CardHeroImageContext = {
  imageUri: string | null;
  setCode: string | null;
  setName: string | null;
};

export async function resolveCardHeroImage(
  prisma: PrismaClient,
  oracleId: string,
  defaultImageUri: string | null,
  setCodeParam?: string | null,
): Promise<CardHeroImageContext> {
  const setCode = setCodeParam?.trim().toLowerCase();

  if (!setCode) {
    return {
      imageUri: defaultImageUri,
      setCode: null,
      setName: null,
    };
  }

  const [setCard, mtgSet] = await Promise.all([
    prisma.setCard.findUnique({
      where: {
        setCode_oracleId: {
          setCode,
          oracleId,
        },
      },
      select: { imageUri: true },
    }),
    prisma.mtgSet.findUnique({
      where: { code: setCode },
      select: { name: true },
    }),
  ]);

  return {
    imageUri: setCard?.imageUri ?? defaultImageUri,
    setCode: mtgSet ? setCode : null,
    setName: mtgSet?.name ?? null,
  };
}
