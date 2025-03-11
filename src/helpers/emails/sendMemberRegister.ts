// Vendors
import { sendEmail } from 'vendors/mailersend/email'

const sendMemberRegister = async ({
  email,
  firstName = 'User'
}: {
  email: string
  firstName: string | undefined
}) => {
  return await sendEmail({
    recipients: [{ email }],
    subject: 'Welcome to...',
    templateId: '',
    personalization: [
      {
        email,
        data: {
          name: firstName
        }
      }
    ]
  })
}

export default sendMemberRegister
