// Packages
import { FileArray } from 'express-fileupload'
import { Model } from 'mongoose'

// Interfaces
import { IAsset } from '@api/general/assets/models/IAsset'

// Models
import Asset from '@api/general/assets/models/asset'
import { uploadAsset } from '@api/general/assets/actions/asset'

// Middlewares
import { AuthRequest } from '@middleware/auth'

const parseAndUploadAsset = async ({
  files,
  auth
}: {
  files?: FileArray | null
  auth?: AuthRequest
}) => {
  const assets = []

  if (files) {
    const filePaths = Object.keys(files)

    for (let i = 0; i < filePaths.length; i++) {
      const filePath = filePaths[i]

      const rawFile = files[filePath]

      if (!Array.isArray(rawFile)) {
        const asset = await uploadAsset({ rawFile, auth, root: 'assets', model: Asset })

        assets.push({ filePath, asset })
      }
    }
  }

  return assets
}

const parseAndUploadDynamicAsset = async <T extends IAsset>({
  files,
  auth,
  model,
  root
}: {
  files?: FileArray | null
  auth?: AuthRequest
  model: Model<T>
  root: string
}) => {
  const assets = []

  if (files) {
    const filePaths = Object.keys(files)

    for (let i = 0; i < filePaths.length; i++) {
      const filePath = filePaths[i]

      const rawFile = files[filePath]

      if (!Array.isArray(rawFile)) {
        const asset = await uploadAsset({ rawFile, auth, root, model })

        assets.push({ filePath, asset })
      }
    }
  }

  return assets
}

export { parseAndUploadAsset, parseAndUploadDynamicAsset }
