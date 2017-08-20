import Vue from 'vue'
import Router from 'vue-router'
import TreemapConstructor from '@/components/TreemapConstructor'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '*',
      name: 'TreemapConstructor',
      component: TreemapConstructor
    }
  ]
})
