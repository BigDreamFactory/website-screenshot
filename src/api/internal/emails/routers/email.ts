import express from 'express'

import { ClientError, handleClientError } from '@helpers/errors/exception'

import { sendEmail, validSenderEmails, getTemplates } from 'vendors/mailersend/email'

import { isEmail } from '@helpers/utils/validator'
import { instanceOfObjectId } from '@helpers/utils/interfaces'

const router = express.Router()

router.get('/emails/senders', (_req, res) => {
  const emails = validSenderEmails()
  res.send(emails)
})

router.get('/emails/templates', async (_req, res) => {
  try {
    const templates = await getTemplates()
    res.send(templates)
  } catch (error) {
    const { details, status } = handleClientError(error)
    res.status(status).send(details)
  }
})

router.post('/emails/send', async (req, res) => {
  try {
    const {
      recipients,
      templateId
    }: { recipients?: { email: string; contactId: string }[]; templateId?: string } = req.body

    if (!recipients) {
      throw new ClientError('missing_recipients', 'Missing recipients')
    }

    if (!templateId) {
      throw new ClientError('missing_template_id', 'Missing template id')
    }

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i]

      if (!isEmail(recipient.email)) {
        throw new ClientError('incorrect_recipient_email', 'Incorrect recipient email')
      }

      if (!instanceOfObjectId(recipient.contactId)) {
        throw new ClientError('incorrect_contact_id', 'Incorrect contact ID')
      }
    }

    const providerResponse = await sendEmail({
      recipients,
      personalization: recipients.map((recipient) => ({
        email: recipient.email,
        data: {
          contactId: recipient.contactId
        }
      })),
      subject: '',
      templateId
    })

    res.send(providerResponse)
  } catch (error) {
    const { details, status } = handleClientError(error)
    res.status(status).send(details)
  }
})

router.post('/emails/test', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      throw new ClientError('missing_email', 'Missing recipient email')
    }

    const providerResponse = await sendEmail({
      recipients: [{ email }],
      subject: 'Testing',
      html: 'This is the HTML content',
      text: 'This is the text content'
    })

    res.send(providerResponse)
  } catch (error) {
    const { details, status } = handleClientError(error)
    res.status(status).send(details)
  }
})

export default router
