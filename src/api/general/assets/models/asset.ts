import mongoose from 'mongoose'

import { IAsset, IImageAsset, IImageProperty, IFileAsset } from './IAsset'

// Constants
import imageSizes from '@config/constants/imageSizes.json'

const getImageSizes = () => {
  const sizeSchema: { [key: string]: unknown } = {}

  imageSizes.forEach((size) => {
    sizeSchema[size.title] = {
      type: imagePropertySchema,
      required: false
    }
  })

  return sizeSchema
}

const imagePropertySchema = new mongoose.Schema<IImageProperty>(
  {
    width: {
      type: Number,
      required: true
    },
    height: {
      type: Number,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  },
  { _id: false }
)

const imageAssetSchema = new mongoose.Schema<IImageAsset>(
  {
    size: {
      original: {
        type: imagePropertySchema,
        required: true
      },
      ...getImageSizes()
    },
    placeholder: {
      type: String,
      required: true
    }
  },
  { _id: false }
)

const fileAssetSchema = new mongoose.Schema<IFileAsset>(
  {
    size: {
      type: Number,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  },
  { _id: false }
)

const assetSchema = new mongoose.Schema<IAsset>(
  {
    name: {
      type: String,
      required: true
    },
    hash: {
      type: String,
      required: true
    },
    alt: {
      type: String
    },
    ext: {
      type: String,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    image: {
      type: imageAssetSchema,
      required: false
    },
    file: {
      type: fileAssetSchema,
      required: false
    },
    tags: {
      type: [String],
      required: false
    },
    owner: {
      type: {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: false
        },
        member: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Member',
          required: false
        }
      },
      _id: false,
      select: false
    }
  },
  {
    id: false,
    timestamps: true
  }
)

const Asset = mongoose.model<IAsset>('Asset', assetSchema)

export { Asset as default, imageAssetSchema, fileAssetSchema }
