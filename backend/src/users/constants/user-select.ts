export const userSelect = {
  id: true,
  email: true,
  roleId: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  deletedBy: true,
  role: {
    select: {
      name: true,
    },
  },
};
