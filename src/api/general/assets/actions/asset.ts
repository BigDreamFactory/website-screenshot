// Packages
import { Model, ObjectId } from 'mongoose'
import sharp from 'sharp'
import { getPlaiceholder } from 'plaiceholder'
import slugify from 'slugify'
import { UploadedFile } from 'express-fileupload'

// Constants
import imageSizes from '@config/constants/imageSizes.json'

// Middleware
import { AuthRequest } from '@middleware/auth'

// Models
import Asset from '../models/asset'

// Interfaces
import { IAsset, ImageSize } from '../models/IAsset'

// Vendors
import { uploadFile, deleteFile, FileData, uploadMultipleFiles } from 'vendors/aws/s3'

// Helpers
import { randomString } from '@helpers/utils/random'
import { ClientError } from '@helpers/errors/exception'

interface URLParams {
  name: string
  hash: string
  ext: string
}

interface Metadata {
  width: number
  height: number
  size: number
}

interface Size {
  title: string
  width: number
}

const uploadAsset = async <T extends IAsset>({
  rawFile,
  data,
  auth,
  root,
  model
}: {
  rawFile: UploadedFile
  data?: { alt?: string; tags?: string[] }
  auth?: AuthRequest
  root?: string
  model: Model<T>
}) => {
  const file = formatFile(rawFile)

  const asset = new model(formatAsset({ file, data, owner: getOwner(auth) }))

  if (file.mimetype.includes('image')) {
    const images = await formatImages(file, asset, imageSizes, root)

    // Upload original image
    const original = images[0]
    const { base64: placeholder } = await getPlaiceholder(original.buffer)

    asset.image = {
      size: {
        original: original.property
      },
      placeholder
    }

    if (file.mimetype.includes('svg')) {
      await uploadFile(file.data, original.key, file.mimetype)
    } else {
      const files: FileData[] = []

      files.push({ buffer: original.buffer, key: original.key, mimetype: file.mimetype })

      // Upload formatted images
      for (let i = 1; i < images.length; i++) {
        const { sizeTitle, property, buffer, key } = images[i]

        asset.image.size[sizeTitle as keyof ImageSize] = property

        files.push({ buffer: buffer, key: key, mimetype: file.mimetype })
      }

      await uploadMultipleFiles(files)
    }
  } else {
    const url = formatFileURL({ params: asset, root })

    asset.file = {
      url,
      size: file.size
    }

    await uploadFile(file.data, url, file.mimetype)
  }

  await asset.save()

  return asset
}

const deleteAsset = async ({
  _id,
  model = Asset,
  root
}: {
  _id: string | ObjectId
  model?: Model<IAsset>
  root?: string
}) => {
  const asset = await model.findById(_id)

  if (!asset) {
    throw new ClientError('no_matches', 'No matches found', 404)
  }

  if (asset.image) {
    const sizes = imageSizes.map((size) => size.title)

    for (let i = 0; i < sizes.length; i++) {
      const size = sizes[i]
      const image = asset.image.size[size as keyof typeof asset.image.size]

      if (image) {
        await deleteFile(image.url)
      }
    }
    await deleteFile(asset.image.size.original.url)
  } else {
    deleteFile(formatFileURL({ params: asset, root }))
  }

  await asset.delete()
}

const getOwner = (auth?: AuthRequest): { member: string } | { user: string } | undefined => {
  if (!auth) {
    return
  }

  switch (auth.owner) {
    case 'Member':
      return {
        member: auth.user._id
      }
    case 'User':
      return {
        user: auth.user._id
      }
  }
}

const formatFile = (file?: UploadedFile) => {
  if (!file) {
    throw new ClientError('missing_file', 'Missing file', 400)
  }

  return file
}

const formatAsset = ({
  file,
  data,
  owner
}: {
  file: UploadedFile
  data?: { alt?: string; tags?: string[] }
  owner?: object
}) => {
  const filename = file.name.split('.')

  const ext = filename.pop()

  const name = filename.join('.')

  const hash = slugify(name, { replacement: '_', strict: true, lower: true })

  return {
    name,
    hash: `${hash}_${randomString()}`,
    alt: data?.alt,
    tags: data?.tags,
    ext: `.${ext}`,
    mimetype: file.mimetype,
    owner
  }
}

const formatImages = async (file: UploadedFile, asset: URLParams, sizes: Size[], root?: string) => {
  const sharpImage = sharp(file.data)
  const image = await sharpImage.toBuffer({ resolveWithObject: true })
  const metadata = image.info

  if (!metadata.width || !metadata.height || !metadata.size) {
    throw new ClientError('invalid_image', 'Invalid image', 400)
  }

  const url = formatImageURL({ params: asset, root })

  const images = [
    {
      sizeTitle: 'original',
      key: url,
      buffer: file.data,
      property: formatProperty(metadata, url)
    }
  ]

  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i]

    if (metadata.width > size.width) {
      const resizedImage = await sharpImage.resize(size.width).toBuffer({ resolveWithObject: true })
      const resizedMetadata = resizedImage.info
      const url = formatImageURL({ params: asset, suffix: `_${size.title}`, root })

      images.push({
        sizeTitle: size.title,
        key: url,
        buffer: resizedImage.data,
        property: formatProperty(resizedMetadata, url)
      })
    }
  }

  return images
}

const formatFileURL = ({ params, root = 'assets' }: { params: URLParams; root?: string }) => {
  return `/${root}/${params.hash}${params.ext}`
}

const formatImageURL = ({
  params,
  suffix = '',
  root = 'assets'
}: {
  params: URLParams
  suffix?: string
  root?: string
}) => {
  return `/${root}/${params.hash}/${params.hash}${suffix}${params.ext}`
}

const formatProperty = (metadata: Metadata, url: string) => {
  return {
    width: metadata.width,
    height: metadata.height,
    size: metadata.size,
    url
  }
}

export { formatFile, formatAsset, formatImages, formatFileURL, uploadAsset, deleteAsset }
