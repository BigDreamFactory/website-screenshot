// Vendors
import { sendEmail } from 'vendors/mailersend/email'

const sendResetPassword = async ({
  email,
  firstName = 'User',
  resetPasswordLink
}: {
  email: string
  firstName?: string
  resetPasswordLink: string
}) => {
  return await sendEmail({
    recipients: [
      {
        email
      }
    ],
    subject: 'You have received a forgot password request',
    templateId: '',
    personalization: [
      {
        email,
        data: {
          name: firstName,
          resetPasswordLink
        }
      }
    ]
  })
}

export default sendResetPassword
