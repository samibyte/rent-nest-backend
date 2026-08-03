import { prisma } from "../../lib/prisma.js";

const getAllRegions = async () => {
  return await prisma.region.findMany({
    orderBy: { name: "asc" },
  });
};

export const regionService = { getAllRegions };
