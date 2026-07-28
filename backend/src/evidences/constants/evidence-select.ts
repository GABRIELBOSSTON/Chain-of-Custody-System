export const evidenceSelect = {
  id: true,
  caseId: true,
  evidenceNumber: true,
  title: true,
  description: true,
  category: true,
  collectionDate: true,
  collectionLocation: true,
  status: true,
  storageLocation: true,
  isReadyForTransfer: true,
  createdAt: true,
  updatedAt: true,
  case: {
    select: {
      caseNumber: true,
      title: true,
      status: true,
    }
  },
  attachments: true,
  hashes: true,
  qrCode: true,
};
