import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/lib/firebase/client';

function sanitizeFileName(name: string) {
  const lastDot = name.lastIndexOf('.');
  const base = (lastDot >= 0 ? name.slice(0, lastDot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'image';
  const ext = lastDot >= 0 ? name.slice(lastDot).toLowerCase().replace(/[^.a-z0-9]/g, '') : '';
  return `${base}${ext}`;
}

export async function uploadProductImage(params: {
  ownerId: string;
  storeId: string;
  file: File;
}) {
  const timestamp = Date.now();
  const fileName = sanitizeFileName(params.file.name);
  const path = `stores/${params.storeId}/products/${params.ownerId}-${timestamp}-${fileName}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, params.file, {
    contentType: params.file.type || undefined,
  });

  const url = await getDownloadURL(storageRef);
  return { imageUrl: url, imagePath: path };
}

export async function deleteStorageFile(path?: string | null) {
  if (!path) return;

  try {
    await deleteObject(ref(storage, path));
  } catch (error) {
    console.warn('Unable to delete storage file:', error);
  }
}

export async function uploadPaymentProof(params: {
  ownerId: string;
  storeId: string;
  file: File;
}) {
  const timestamp = Date.now();
  const fileName = sanitizeFileName(params.file.name);
  const path = `stores/${params.storeId}/payment-proofs/${params.ownerId}-${timestamp}-${fileName}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, params.file, {
    contentType: params.file.type || undefined,
  });

  const url = await getDownloadURL(storageRef);
  return { imageUrl: url, imagePath: path };
}
