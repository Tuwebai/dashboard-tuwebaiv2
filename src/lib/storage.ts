

export interface FileData {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
  userId: string;
}

const storage = getStorage(app);

export const uploadFile = async (file: File, userId: string): Promise<FileData> => {
  try {
    const timestamp = Date.now();
    const fileName = `${userId}/${timestamp}_${file.name}`;
    const storageRef = ref(storage, fileName);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    const fileData: FileData = {
      id: snapshot.ref.name,
      name: file.name,
      url: downloadURL,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      userId
    };
    
    return fileData;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Error al subir el archivo');
  }
};

export const getFiles = async (userId: string): Promise<FileData[]> => {
  try {
    const userFolderRef = ref(storage, userId);
    const result = await listAll(userFolderRef);
    
    const files: FileData[] = [];
    
    for (const itemRef of result.items) {
      const url = await getDownloadURL(itemRef);
      const metadata = await getMetadata(itemRef);
      
      files.push({
        id: itemRef.name,
        name: metadata.name,
        url,
        size: metadata.size,
        type: metadata.contentType || 'application/octet-stream',
        uploadedAt: new Date(metadata.timeCreated).toISOString(),
        userId
      });
    }
    
    return files;
  } catch (error) {
    console.error('Error getting files:', error);
    return [];
  }
};

export const deleteFile = async (fileId: string, userId: string): Promise<void> => {
  try {
    const fileRef = ref(storage, `${userId}/${fileId}`);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Error al eliminar el archivo');
  }
};
