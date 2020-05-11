# 1. 探究 keep-alive 如何命中组件

## 1-1.keep-alive 如何利用 include 和 exclude

**keep-alive** 是 vue 官方提供的组件，用以缓存命中的组件的当前状态

keep-alive 的用法是可以提供一个 include 的 prop 来控制命中的规则可以是 **string** **array** **RegExp** 类型的值

```js
{
  name: 'keep-alive',
  mounted: function mounted () {
    var this$1 = this;

    this.$watch('include', function (val) {
      pruneCache(this$1, function (name) { return matches(val, name); });
    });
    this.$watch('exclude', function (val) {
      pruneCache(this$1, function (name) { return !matches(val, name); });
    });
  },
}
```

从这段代码可以看出 keep-alive 组件是在组件 **mounted** 的生命周期时 watch 了 **include** 和 **exclude** 两个 prop
可以看出主要是调用了 matches 这个函数

matches 这个函数非常的简单，主要是对你设置的 prop 进行了类型判断然后分别调用了不同的 match 方法

```js
function matches(pattern, name) {
  if (Array.isArray(pattern)) {
    return pattern.indexOf(name) > -1;
  } else if (typeof pattern === 'string') {
    return pattern.split(',').indexOf(name) > -1;
  } else if (isRegExp(pattern)) {
    return pattern.test(name);
  }
  /* istanbul ignore next */
  return false;
}
```

## 2. keep-alive 的 render 函数做了什么

### 2-1. keep-alive 没有生效

探究 **keep-alive** 是因为当时我遇到一个问题，在 dom 是以下结构时

```html
<keep-alive>
  <div>
    <router-view></router-view>
  </div>
</keep-alive>
```

keep-alive 组件并没生效，这是为什么呢？

```js
render: function render() {
  var slot = this.$slots.default;
  var vnode = getFirstComponentChild(slot);
  var componentOptions = vnode && vnode.componentOptions;
  if (componentOptions) {
    // check pattern
    var name = getComponentName(componentOptions);
    var ref = this;
    var include = ref.include;
    var exclude = ref.exclude;
    if (
      // not included
      (include && (!name || !matches(include, name))) ||
      // excluded
      (exclude && name && matches(exclude, name))
    ) {
      return vnode;
    }

    var ref$1 = this;
    var cache = ref$1.cache;
    var keys = ref$1.keys;
    var key =
      vnode.key == null
        ? // same constructor may get registered as different local components
          // so cid alone is not enough (#3269)
          componentOptions.Ctor.cid +
          (componentOptions.tag ? '::' + componentOptions.tag : '')
        : vnode.key;
    if (cache[key]) {
      vnode.componentInstance = cache[key].componentInstance;
      // make current key freshest
      remove(keys, key);
      keys.push(key);
    } else {
      cache[key] = vnode;
      keys.push(key);
      // prune oldest entry
      if (this.max && keys.length > parseInt(this.max)) {
        pruneCacheEntry(cache, keys[0], keys, this._vnode);
      }
    }

    vnode.data.keepAlive = true;
  }
  return vnode || (slot && slot[0]);
}
```

**keep-alive** 组件并没有渲染实际的元素，而是渲染了 **slot**

```js
var vnode = getFirstComponentChild(slot);
```

在上面这段代码时，**keep-alive** 读取了 **slot** 里第一个 **component** , 但这是在上面的 dom 结构中他的 **slot** 是个 **div** ，
不是一个 **vnode** ，就走不到下面的逻辑，所以那种 dom 结构 **keep-alive** 是不生效的

## 2-2. keep-alive 是如何缓存组件的

```js
if (cache[key]) {
  vnode.componentInstance = cache[key].componentInstance;
  // make current key freshest
  remove(keys, key);
  keys.push(key);
} else {
  cache[key] = vnode;
  keys.push(key);
  // prune oldest entry
  if (this.max && keys.length > parseInt(this.max)) {
    pruneCacheEntry(cache, keys[0], keys, this._vnode);
  }
}
```

这段代码就是 keep-alive 命中缓存的代码，查询当前 component 的 **key** ，在 cache 中是否存在，存在即将 componentInstance 设为 **cache** 中的组件的 componentInstance

## 2-3. activated 生命周期是如何调用

这段代码中把 vnode.data.keepAlive 设置为了 true

```js
vnode.data.keepAlive = true;
```

这个值是写在了 VNode 上，下面要看一段 VNode 有关的代码

```js
function patch (oldVnode, vnode, hydrating, removeOnly) {
    ......
    invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch);
  }

function invokeInsertHook (vnode, queue, initial) {
  // delay insert hooks for component root nodes, invoke them after the
  // element is really inserted
  if (isTrue(initial) && isDef(vnode.parent)) {
    vnode.parent.data.pendingInsert = queue;
  } else {
    for (var i = 0; i < queue.length; ++i) {
      queue[i].data.hook.insert(queue[i]);
    }
  }
}
```

在 vue 中 VNode patch 的过程中 会在最后调用一下 **invokeInsertHook** 这个方法，这个方法是把 VNode.data.hook 里的 insert 方法都调用了一遍, 这个 insert 方法又是什么呢，看下面一段代码

```js
var componentVNodeHooks = {
  insert: function insert (vnode) {
    var context = vnode.context;
    var componentInstance = vnode.componentInstance;
    if (!componentInstance._isMounted) {
      componentInstance._isMounted = true;
      callHook(componentInstance, 'mounted');
    }
    if (vnode.data.keepAlive) {
      if (context._isMounted) {
        queueActivatedComponent(componentInstance);
      } else {
        activateChildComponent(componentInstance, true /* direct */);
      }
    }
  }
```

这段代码是 vnode hooks 的 insert 方法，里面就判断了 vnode.data.keepAlive 的状态，然后进行操作，**activateChildComponent** 这个函数里就对 VNode 声明的 actived 生命周期进行了调用

```js
function activateChildComponent(vm, direct) {
  if (direct) {
    vm._directInactive = false;
    if (isInInactiveTree(vm)) {
      return;
    }
  } else if (vm._directInactive) {
    return;
  }
  if (vm._inactive || vm._inactive === null) {
    vm._inactive = false;
    for (var i = 0; i < vm.$children.length; i++) {
      activateChildComponent(vm.$children[i]);
    }
    callHook(vm, 'activated');
  }
}
```
