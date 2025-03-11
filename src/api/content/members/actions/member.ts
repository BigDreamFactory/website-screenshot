// Base
import { Request, Response } from 'express'

// Models
import Role from '@api/general/roles/models/role'
import Contact from '@api/content/contacts/models/Contact'

// Interfaces
import { IMember } from '@api/content/members/models/IMember'

// Helpers
import { ClientError } from '@helpers/errors/exception'
import { formatDeviceAccess } from '@helpers/endpoints/actions/user'
import sendMemberRegister from '@helpers/emails/sendMemberRegister'

const completeMemberRegistration = async (req: Request, res: Response, user: IMember) => {
  if (!req.body.password) {
    throw new ClientError('missing_password', 'Missing password', 400)
  }

  if (!user.role) {
    const memberRole = await Role.findOne({ name: 'Member' })
    if (memberRole) {
      user.role = memberRole._id
    }
  }
  const token = user.generateAuthToken(formatDeviceAccess({ info: req.userAgent, ip: req.ip }))
  await user.save()

  try {
    const contact = new Contact({ email: user.email })
    await contact.save()
  } catch {
    /* empty */
  }

  await sendMemberRegister({
    email: user.email,
    firstName: user.details?.firstName
  })

  res.status(201).send({ token, user: user.sanitize(req) })
}

export { completeMemberRegistration }
