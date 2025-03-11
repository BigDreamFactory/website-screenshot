// Handlers
import { ClientError } from '@helpers/errors/exception'

// Interfaces
import { IMemberModel } from '@api/content/members/models/IMember'
import { Access } from '@api/general/users/models/IUser'

interface Profile {
  id: string
  emails?: {
    value: string
    verified?: 'true' | 'false'
  }[]
  name?: {
    givenName: string
    familyName: string
  }
}

const parseProvider = async <T extends IMemberModel>({
  profile,
  model,
  access
}: {
  profile: Profile
  model: T
  access: Access
}) => {
  if (!profile.emails || !profile.name) {
    throw new ClientError('invalid_profile', 'Invalid Profile', 401)
  }
  const email = profile.emails[0].value
  const details = {
    firstName: profile.name.givenName,
    lastName: profile.name.familyName
  }
  const { user, status } = await model.findOrCreateByProvider(email, details)
  const token = user.generateAuthToken(access)
  await user.save()
  return { token, user, status }
}

export { parseProvider as default }
