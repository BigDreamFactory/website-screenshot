import { isObject } from './interfaces'

const merge = <T extends object>(target: T, source: T, clone = true) => {
  const t = clone ? Object.assign({}, target) : target
  const s = clone ? Object.assign({}, source) : source
  // Iterate through `source` properties and if an `Object` set property to merge of `target` and `source` properties
  for (const item of Object.keys(s)) {
    const key = item as keyof T
    const sourceKey = s[key] as unknown as T
    const targetKey = (t ? t[key] : null) as unknown as T
    if (isObject(sourceKey)) {
      Object.assign(sourceKey as T, merge<T>(targetKey as T, sourceKey as T, clone))
    }
  }
  // Join `target` and modified `source`
  Object.assign(t || {}, s)
  return t
}

const filterKeys = ({
  target,
  keys,
  inverted,
  matchKey = true
}: {
  target: object
  keys: string[]
  inverted?: boolean
  matchKey?: boolean
}) => {
  const targetKeys = Object.keys(target)

  const filtered: { [key: string]: unknown } = {}

  for (let i = 0; i < targetKeys.length; i++) {
    const key = targetKeys[i]
    const item = target[key as keyof object] as object

    if (keys.includes(key)) {
      if (inverted) {
        filtered[key as keyof object] = item
      }
    } else if (isObject(item)) {
      for (let j = 0; j < keys.length; j++) {
        const allowedItem = keys[j]

        const [base, ...nestedPath] = allowedItem.split('.')
        if (base && base == key) {
          filtered[base as keyof object] = filterKeys({
            target: item,
            keys: [nestedPath.join('.')],
            inverted,
            matchKey
          })
        } else if (!inverted) {
          if (!matchKey) {
            filtered[key] = filterKeys({ target: item, keys, inverted, matchKey })
          } else {
            filtered[key] = item
          }
        }
      }
    } else if (!inverted) {
      Object.assign(filtered, { [key]: item })
    }
  }

  return filtered
}

export { merge, filterKeys }
