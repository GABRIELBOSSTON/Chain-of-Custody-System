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
  
  parentId: true,
  warrantNumber: true,
  consentReference: true,
  seizureAuth: true,
  legalBasis: true,
  storageBuilding: true,
  storageRoom: true,
  storageCabinet: true,
  storageShelf: true,
  storageLocker: true,

  parent: {
    select: {
      id: true,
      evidenceNumber: true,
      title: true,
    }
  },
  children: {
    select: {
      id: true,
      evidenceNumber: true,
      title: true,
    }
  },
  courtPresentations: true,

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
