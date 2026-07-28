export const custodyEventSelect = {
  id: true,
  evidenceId: true,
  action: true,
  actorId: true,
  recipientId: true,
  location: true,
  eventTime: true,
  notes: true,
  isOverdue: true,
  externalOrganization: true,
  externalRecipientName: true,
  signatureName: true,
  transferReason: true,
  actor: {
    select: {
      id: true,
      email: true,
      policeProfile: {
        select: {
          fullName: true,
          policeId: true,
        }
      }
    }
  },
  recipient: {
    select: {
      id: true,
      email: true,
      policeProfile: {
        select: {
          fullName: true,
          policeId: true,
        }
      }
    }
  }
};
