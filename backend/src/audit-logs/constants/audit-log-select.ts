export const auditLogSelect = {
  id: true,
  userId: true,
  action: true,
  entityId: true,
  entityType: true,
  description: true,
  timestamp: true,
  user: {
    select: {
      email: true,
      policeProfile: {
        select: { fullName: true }
      }
    }
  }
};
