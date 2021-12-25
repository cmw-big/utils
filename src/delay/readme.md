# delay函数的使用方式

1. 导入`createDelay` 方法创建`delay`函数。
   1. 参数：`willRejected` 是否创建拒绝的延迟方法。默认值为`false`。
2. 导入`delay`方法直接使用
   1. 默认是成功的。也可以使用`delay.reject`调用就是返回失败的`delay`
   2. `delay`方法的参数：

      ```ts
      export interface DelayOptions<T> {
        value?: T // 延迟函数返回值
        willRejected?: boolean // 是否是失败状态
        signal?: AbortController['signal'] // 是否利用abortController
      }
      ```

   3. `delay.range`方法创建一个时间区间（左闭又开）随机的整数的延迟。
      1. 参数:`(minium: number, maximum: number, options?: DelayOptions<T>)`
   4. 返回值：带有`clear`方法的一个`Promise`。可以调用`clear`方法，提前得到延迟结果`value`
   5. 参数传入`signal`的话，还可以和`AbortController`进行结合使用。将当前延迟函数给取消掉。

下面是例子:

例子1：调用`clear`，延迟函数失效，会立即执行。

```ts
;(async () => {
  const delayPromise = delay(1000, { value: 'hello' })
  delayPromise.then(console.log) // 不会等到1s后才打印。clear调用后。立马将promise状态改变为成功。
  delayPromise.clear()
})()

```

例子2：调用`abort`立即取消当前延迟函数。将`promise`状态变为失败。与`clear`效果差不多。不过`clear`是根据创建delay时的状态来，`abort`一直是失败。
同时`abort`这种方式，也是`axios`中取消网络请求的方式。

```ts
;(async () => {
  const abortController = new AbortController()
  setTimeout(() => {
    abortController.abort()
  }, 500)

  const delayPromise = delay(1000, { value: 'hello', signal: abortController.signal })
  delayPromise.catch(console.log)
})()
```
