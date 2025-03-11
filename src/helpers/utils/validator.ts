const isEmail = (email: string) => {
  const emailRegex =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/ // eslint-disable-line
  return emailRegex.test(email)
}

const isPhoneNumber = (phoneNumber: string) => {
  const phoneRegex = /^\+\d{10,}$/

  return phoneRegex.test(phoneNumber)
}

export { isEmail, isPhoneNumber }
