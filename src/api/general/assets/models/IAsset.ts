import { Document } from 'mongoose'

// Interfaces
import { SchemaType } from '@helpers/utils/interfaces'

// Models
import { IMember } from '@api/content/members/models/IMember'
import { IUser } from '@api/general/users/models/IUser'

interface IImageProperty {
  width: number
  height: number
  size: number
  url: string
}

interface ImageSize {
  original: IImageProperty
  [key: string]: IImageProperty
}

interface IImageAsset {
  size: ImageSize
  placeholder: string
}

interface IFileAsset {
  size: number
  url: string
}

interface IAsset extends Document {
  name: string
  hash: string
  alt?: string
  ext: string
  mimetype: string
  image?: IImageAsset
  file?: IFileAsset
  tags?: string[]
  owner?: {
    user?: SchemaType<IUser>
    member?: SchemaType<IMember>
  }
}

export { IAsset, IImageAsset, IImageProperty, IFileAsset, ImageSize }
