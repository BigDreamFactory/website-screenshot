// Interfaces
import { IAsset, IFileAsset, IImageAsset } from '@api/general/assets/models/IAsset'

export interface ImageDetails {
  _id: string
  name: string
  image: IImageAsset
  alt?: string
}

export interface FileDetails {
  name: string
  file: IFileAsset
  alt?: string
}

const formatImageDetails = (asset: IAsset): ImageDetails => {
  if (!asset.image) {
    throw new Error('Asset is missing image')
  }

  return {
    _id: asset._id,
    name: asset.name,
    image: asset.image,
    alt: asset.alt
  }
}

const formatFileDetails = (asset: IAsset): FileDetails => {
  if (!asset.file) {
    throw new Error('Asset is missing file')
  }

  return {
    name: asset.name,
    file: asset.file,
    alt: asset.alt
  }
}

export { formatImageDetails, formatFileDetails }
