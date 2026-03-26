import { type RouteRecordRaw, createRouter, createWebHashHistory } from 'vue-router';
import { useCartStore, useUserStore } from '@/stores';

const { VITE_TITLE } = import.meta.env;

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Front',
    component: () => import('@/layout/FrontLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/front/Home/HomeView.vue'),
        meta: { title: VITE_TITLE },
      },
      {
        path: 'mall',
        name: 'Mall',
        component: () => import('@/views/front/Mall/MallView.vue'),
        meta: { title: 'Mall - Travel Fun' },
      },
      {
        path: 'activity',
        name: 'Activity',
        component: () => import('@/views/front/Activity/ActivityView.vue'),
        meta: { title: 'Activity - Travel Fun' },
      },
      {
        path: 'member',
        name: 'Member',
        component: () => import('@/views/front/Member/MemberView.vue'),
        meta: {
          title: 'Member - Travel Fun',
          requiresAuth: true,
        },
      },
      {
        path: 'forum',
        name: 'Forum',
        component: () => import('@/views/front/Forum/ForumView.vue'),
        meta: { title: 'Forum - Travel Fun' },
      },
      {
        path: 'forum/post/:id',
        name: 'PostDetail',
        component: () => import('@/views/front/Forum/components/PostDetail.vue'),
        meta: { title: 'Post - Travel Fun' },
      },
      {
        path: 'login',
        name: 'Login',
        component: () => import('@/views/front/Login/LoginView.vue'),
        meta: { title: 'Login - Travel Fun' },
      },
      {
        path: 'register',
        name: 'Register',
        component: () => import('@/views/front/Login/components/Register.vue'),
        meta: { title: 'Register - Travel Fun' },
      },
      {
        path: 'country/:countryName',
        name: 'Country',
        component: () => import('@/views/front/Country/CountryView.vue'),
        meta: { title: 'Country - Travel Fun' },
      },
      {
        path: 'city/:cityName',
        name: 'City',
        component: () => import('@/views/front/City/CityView.vue'),
        meta: { title: 'City - Travel Fun' },
      },
      {
        path: 'city/:cityName/products/:category?',
        name: 'CityProducts',
        component: () => import('@/views/front/Products/ProductsView.vue'),
        props: route => ({ sort: route.query.sort, mode: 'city' }),
        meta: { title: 'Products - Travel Fun' },
      },
      {
        path: 'country/:countryName/products/:category?',
        name: 'CountryProducts',
        component: () => import('@/views/front/Products/ProductsView.vue'),
        props: route => ({ sort: route.query.sort, mode: 'country' }),
        meta: { title: 'Products - Travel Fun' },
      },
      {
        path: 'product/:productId',
        name: 'Product',
        component: () => import('@/views/front/Product/ProductView.vue'),
        meta: { title: 'Product - Travel Fun' },
      },
      {
        path: 'cart',
        name: 'Cart',
        component: () => import('@/views/front/Cart/CartView.vue'),
        meta: { title: 'Cart - Travel Fun' },
        async beforeEnter() {
          const cartStore = useCartStore();
          await cartStore.getCarts();
        },
      },
      {
        path: 'booking',
        name: 'Book',
        component: () => import('@/views/front/Book/BookView.vue'),
        children: [
          {
            path: 'order',
            name: 'Order',
            component: () => import('@/views/front/Book/components/Order.vue'),
            meta: { title: 'Order - Travel Fun' },
          },
          {
            path: 'pay/:orderId',
            name: 'Pay',
            component: () => import('@/views/front/Book/components/Pay.vue'),
            meta: { title: 'Pay - Travel Fun' },
          },
          {
            path: 'done/:orderId',
            name: 'Done',
            component: () => import('@/views/front/Book/components/Done.vue'),
            meta: { title: 'Done - Travel Fun' },
          },
        ],
      },
      {
        path: 'wishlist',
        name: 'WishList',
        component: () => import('@/views/front/WishList/WishListView.vue'),
        meta: { title: 'Wishlist - Travel Fun' },
      },
      {
        path: 'about',
        name: 'About',
        component: () => import('@/views/front/About/AboutView.vue'),
        meta: { title: 'About - Travel Fun' },
      },
    ],
  },
  {
    path: '/admin',
    name: 'Dashboard',
    component: () => import('@/layout/Dashboard.vue'),
    meta: {
      title: 'Dashboard - Travel Fun',
      requiresAuth: true,
    },
    children: [
      {
        path: 'home',
        name: 'AdminHome',
        component: () => import('@/views/admin/Home/AdminHomeView.vue'),
        meta: {
          title: 'Dashboard Home - Travel Fun',
          requiresAuth: true,
        },
      },
      {
        path: 'list/products',
        name: 'AdminProducts',
        component: () => import('@/views/admin/List/Product/AdminProducts.vue'),
        meta: {
          title: 'Products - Admin',
          requiresAuth: true,
        },
      },
      {
        path: 'list/orders',
        name: 'AdminOrders',
        component: () => import('@/views/admin/List/Order/AdminOrders.vue'),
        meta: {
          title: 'Orders - Admin',
          requiresAuth: true,
        },
      },
      {
        path: 'list/coupons',
        name: 'AdminCoupons',
        component: () => import('@/views/admin/List/Coupon/AdminCoupons.vue'),
        meta: {
          title: 'Coupons - Admin',
          requiresAuth: true,
        },
      },
    ],
  },
  {
    path: '/member',
    name: 'MemberLayout',
    component: () => import('@/views/front/Member/MemberLayout.vue'),
    meta: {
      title: 'Member Center - Travel Fun',
      requiresAuth: true,
    },
    children: [
      {
        path: 'dashboard',
        name: 'MemberDashboard',
        component: () => import('@/views/front/Member/DashboardView.vue'),
        meta: {
          title: 'Member Dashboard - Travel Fun',
          requiresAuth: true,
        },
      },
      {
        path: 'profile',
        name: 'MemberProfile',
        redirect: { name: 'MemberDashboard' },
      },
      {
        path: 'orders',
        name: 'MemberOrders',
        redirect: { name: 'MemberDashboard' },
      },
      {
        path: 'messages',
        name: 'MemberMessages',
        redirect: { name: 'MemberDashboard' },
      },
      {
        path: 'coupons',
        name: 'MemberCoupons',
        redirect: { name: 'MemberDashboard' },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach((to, _from, next) => {
  const userStore = useUserStore();

  if (to.meta.requiresAuth && !userStore.loginStatus) {
    next({
      name: 'Login',
      query: { redirect: to.fullPath },
    });
    return;
  }

  if (typeof to.meta.title === 'string' && to.meta.title.length > 0)
    document.title = to.meta.title;
  else if (VITE_TITLE)
    document.title = VITE_TITLE;

  next();
});

export default router;
