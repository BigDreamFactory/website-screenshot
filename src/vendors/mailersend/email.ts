import MailerSend, { BulkEmails, EmailParams } from 'mailersend'

import emailDetails from '@config/constants/emailDetails.json'
import { ClientError } from '@helpers/errors/exception'

interface EmailInfo {
  email: string
  name?: string
}

interface EmailVariables {
  email: string
  substitutions: {
    var: string
    value: string
  }[]
}

interface EmailPersonalization {
  email: string
  data: { [key: string]: unknown }
}

interface EmailParams {
  from?: string
  fromName?: string
  recipients: EmailInfo[]
  reply_to?: EmailInfo
  subject: string
  text?: string
  html?: string
  attachments?: {
    content: string
    disposition: 'inline' | 'attachment'
    filename: string
  }[]
  templateId?: string
  variables?: EmailVariables[]
  personalization?: EmailPersonalization[]
}

const mailersend = new MailerSend({
  api_key: process.env.MAILERSEND_API_TOKEN
})

// Limit to 5000 emails per minute
const sendEmail = async (params: EmailParams): Promise<{ status: number[] }> => {
  if (!params.templateId && !(params.html || params.text)) {
    throw new ClientError('invalid_params', 'Provide template_id or html/text')
  }

  const parsedParams = { ...emailDetails.defaultParams, ...params }

  if (!emailDetails.senders.some((sender) => sender.email == parsedParams.from)) {
    throw new ClientError(
      'invalid_sender_email',
      'Sender email is missing from verified sender list'
    )
  }

  if (parsedParams.recipients.length > 5000) {
    throw new ClientError('too_many_recipients', 'Too many recipients', 429)
  }

  if (parsedParams.recipients.length == 1) {
    const emailParams = new EmailParams(parsedParams)

    const data = await mailersend.send(emailParams)
    return { status: [data.status] }
  } else {
    const chunkSize = 500

    const chunkData = []

    for (let i = 0; i < parsedParams.recipients.length; i += chunkSize) {
      const bulkEmails = new BulkEmails()

      const recipientsChunk = parsedParams.recipients.slice(i, i + chunkSize)

      for (let j = 0; j < recipientsChunk.length; j++) {
        const recipient = recipientsChunk[j]

        bulkEmails.addEmail({
          ...parsedParams,
          personalization: getRecipientPersonalization(parsedParams, recipient.email),
          recipients: [recipient]
        })
      }

      const data = await mailersend.sendBulk(bulkEmails)

      chunkData.push(data)
    }
    return { status: chunkData.map((data) => data.status) }
  }
}

const getRecipientPersonalization = (params: EmailParams, recipientEmail: string) => {
  if (!params.personalization) {
    return
  }

  const recipientPersonalization = params.personalization.find(
    (data) => data.email == recipientEmail
  )

  if (!recipientPersonalization) {
    throw new ClientError('incorrect_personalization', 'Incorrect personalization')
  }

  return [recipientPersonalization]
}

const getTemplates = async () => {
  const res = await mailersend.templateList()
  const { data } = await res.json()

  return data
}

const validSenderEmails = () => {
  return emailDetails.senders
}

export { sendEmail, getTemplates, validSenderEmails }
