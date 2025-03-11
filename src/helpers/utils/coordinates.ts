// Helpers
import { ClientError } from '@helpers/errors/exception'
import { instanceOfString } from '@helpers/utils/interfaces'

const getCoordinates = ({ latitude, longitude }: { latitude?: unknown; longitude?: unknown }) => {
  if (!latitude || !longitude) {
    throw new ClientError('missing_coordinates', 'Missing coordinates')
  }

  if (!instanceOfString(latitude) || !instanceOfString(longitude)) {
    throw new ClientError('incorrect_coordinates', 'Incorrect coordinates')
  }

  return {
    latitude,
    longitude
  }
}

export { getCoordinates }
