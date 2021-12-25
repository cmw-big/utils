export interface DelayOptions<T> {
  value?: T
  willRejected?: boolean
  signal?: AbortController['signal']
}
interface MyPromise<T> extends Promise<T | undefined> {
  clear: () => void
}
export interface delay {
  <T>(ms: number, options?: DelayOptions<T>): MyPromise<T | undefined> | MyPromise<Error>
  reject?: delay
  range: <T>(minium: number, maximum: number, options?: DelayOptions<T>) => MyPromise<T | undefined> | MyPromise<Error>
}

export function randomInteger(minimum: number, maximum: number) {
  return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum
}
const createAbortError = () => {
  const error = new Error('Delay aborted')
  error.name = 'AbortError'
  return error
}

// 创建一个delay函数
export function createDelay(willRejected = false): delay {
  let timer: NodeJS.Timeout | null
  let rejectFn: (reason?: any) => void
  let settle: () => void
  const delay = <T>(duration: number, options?: DelayOptions<T>) => {
    // 一开始传入的AbortController就是取消的话。那么直接失败
    if (options?.signal?.aborted) {
      const resultPromise = Promise.reject<Error>(createAbortError())
      ;(resultPromise as MyPromise<Error>).clear = () => {
        // do nothing
      }
      return resultPromise as MyPromise<Error>
    }
    // 调用取消后，肯定就是失败的状态
    const signalListener = () => {
      timer && clearTimeout(timer)
      //  拒绝状态
      rejectFn(createAbortError())
    }
    // 取消监听
    const cleanup = () => {
      if (options?.signal) {
        options.signal.removeEventListener('abort', signalListener)
      }
    }

    const resultPromise = new Promise((resolve: (value?: T) => void, rejected) => {
      // 每次new之前，把之前的请求监听的取消掉。防止重复监听很多。
      cleanup()
      // 处理状态
      settle = () => {
        const status = options?.willRejected || willRejected
        if (status) {
          rejected(options?.value)
        }
        resolve(options?.value)
      }
      timer = setTimeout(settle, duration)
      rejectFn = rejected
      // 如果有signal，那么就监听，abort事件的调用。
      if (options?.signal) {
        options.signal.addEventListener('abort', signalListener, { once: true })
      }
    })
    // 移除定时器以及清除监听函数。
    ;(resultPromise as MyPromise<T>).clear = () => {
      timer && clearTimeout(timer)
      timer = null
      // 清除延迟，相当于立马调用。不进行延迟。
      settle()
    }
    return resultPromise as MyPromise<T>
  }
  delay.range = <K>(minium: number, maximum: number, options?: DelayOptions<K>) =>
    delay(randomInteger(minium, maximum), options)

  return delay
}
// 创建一个带拒绝的delay函数
function createWithRejected() {
  const delay = createDelay()
  delay.reject = createDelay(true)
  return delay
}
export const delay = createWithRejected()
