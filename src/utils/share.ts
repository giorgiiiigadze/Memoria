import { Share } from 'react-native'

export async function shareDrop(title: string, id: string) {
  const url = `https://memoria.app/drop/${id}`
  try {
    await Share.share({
      // url is iOS-only; append to message so Android recipients also get the link
      message: `Check out "${title}" on Memoria\n${url}`,
      url,
    })
  } catch (e) {
    console.error('[shareDrop]', e)
  }
}
