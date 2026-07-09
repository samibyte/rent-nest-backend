import { prisma } from "../../lib/prisma.js";

const getAllCategories = async () => {
  return await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
};

export const categoryService = { getAllCategories };
