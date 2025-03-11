const validateDynamic = async (
  contents: { component: string }[],
  models: { name: string; model: unknown }[]
) => {
  for (let i = 0; i < contents.length; i++) {
    const content = contents[i]

    const model = models.find((model) => content.component == model.name)

    if (!model) {
      throw Error('Provided incorrect component')
    }
  }
}

export { validateDynamic }
