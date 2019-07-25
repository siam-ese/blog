### more see [issue](https://github.com/13030112030/blog/issues)

# 个人博客
1.关于es6 箭头函数this 与 对象
  es6中箭头函数的一大特点是不绑定this的上下文，就算利用bind，call和apply等三种绑定this的函数对箭头函数的this进行绑定也不会生效，箭头函数的this指向顶层作用域上下文。
  当有一个变量声明的箭头函数，然后有一个对象上的某个属性指向该箭头函数，再读对象的属性时会发现指向的箭头函数其实是一个function声明的函数，
  ```
    var a = 1
    var log = () => console.log(this.a)
    var obj = {
      log,
      a: 2
    }
    console.log(obj.log)
    // ƒ log() {
    //  console.log(this.a)
    // }
    console.log(obj.log()) // 2
  ```
  该对象的this上下文指向了该对象，而对象创建时属性声明的箭头函数则是真正的箭头函数，this不会绑定
  ```
    var a = 1
    var log = () => console.log(this.a)
    var obj = {
      log: () => console.log(this.a) ,
      a: 2
    }
    console.log(obj.log)
    // () => {
    //   console.log(this.a)
    // }
    console.log(obj.log()) // 1
  ```
  
