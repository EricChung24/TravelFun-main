<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import {
  AddOutlined,
  CategoryOutlined,
  ChatBubbleOutlined,
  FavoriteBorderOutlined,
  FavoriteOutlined,
  FilterAltOutlined,
  GroupsOutlined,
  LocalOfferOutlined,
  NavigateNextOutlined,
  PersonOutlined,
  SearchOutlined,
  SortOutlined,
  VisibilityOutlined,
} from '@vicons/material';
import {
  NButton,
  NCard,
  NCarousel,
  NDatePicker,
  NForm,
  NFormItem,
  NIcon,
  NInput,
  NModal,
  NSelect,
  NSwitch,
  useMessage,
} from 'naive-ui';
import PostDetailModal from './components/PostDetailModal.vue';
import { useUserStore } from '@/stores';
import { apiForumToggleLike } from '@/utils/api';

const router = useRouter();
const userStore = useUserStore();
const isLoggedIn = computed(() => userStore.loginStatus);
const message = useMessage();

// Ê∑ªÂ? baseUrl ËÆäÈ?
const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ?ïÁ??≠Â? URL ?ÑÂáΩ??function getAuthorAvatar(author: any) {
  if (!author?.avatar)
    return 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

  let avatarUrl = author.avatar;

  // Â¶ÇÊ??ØÂ??¥Á? URLÔºåÁõ¥?•Ë???  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://'))
    return avatarUrl;

  // ÁßªÈô§?ãÈ†≠??media/ ??/media/ÔºàÂ??úÂ??®Ô?
  avatarUrl = avatarUrl.replace(/^media\/|^\/media\//, '');

  // ÊßãÂª∫ÂÆåÊï¥??URL
  return `${baseUrl}/media/${avatarUrl}`;
}

function normalizeComment(comment: any) {
  if (!comment)
    return null;
  const author = comment.author || {};
  return {
    ...comment,
    author: {
      ...author,
      avatar: getAuthorAvatar(author),
    },
  };
}

const title = ref('Ë®éË??Ä');
const activeCategory = ref('?ãÂÖß?ÖÈ?');

// ?ÜÈ??óË°®
const categories = ref([]);

// ?ÇÈÉ®?âÈ??óË°®
const topButtons = ref([]);

// ?áÁ??óË°®
const posts = ref([]);
const isLoading = ref(false);

// ?àÂ?‰∫∫Âì°`n
// Ê¥ªË?‰ΩúËÄ?const activeAuthors = ref([]);

// ?ÜÈ??∏È?
const categoryOptions = ref([]);

// Ê®ôÁ±§?óË°®
const tags = ref([]);
const selectedTags = ref([]);

// ?†Ë??ÜÈ??óË°®
async function loadCategories() {
  try {
    console.log('?ãÂ?ËºâÂÖ•?ÜÈ??óË°®...');
    const response = await axios.get('http://localhost:8000/api/public/categories/', {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('?ÜÈ??óË°®?øÊ?:', response.data);

    if (response.data && response.data.status === 'success' && Array.isArray(response.data.data)) {
      // Á¢∫‰?ÊØèÂÄãÂ?È°ûÈÉΩ?âÂ?Ë¶ÅÁ?Ê¨Ñ‰?
      const validCategories = response.data.data.filter(category =>
        category && typeof category.id === 'number' && typeof category.name === 'string',
      );

      if (validCategories.length === 0) {
        console.error('Ê≤íÊ??âÊ??ÑÂ?È°ûÊï∏??);
        message.error('?°Ê?ËºâÂÖ•?ÜÈ??óË°®');
        return;
      }

      categoryOptions.value = validCategories.map(category => ({
        label: category.name,
        value: category.id,
        description: category.description || '',
        post_count: category.post_count || 0,
      }));

      categories.value = categoryOptions.value;
      topButtons.value = categories.value.map(c => c.label);

      console.log('?ÜÈ??óË°®Â∑≤Êõ¥??', categoryOptions.value);
    }
    else {
      console.error('?°Ê??ÑÂ?È°ûË??ôÊ†ºÂº?', response.data);
      message.error('?ÜÈ?Ë≥áÊ??ºÂ??ØË™§');
      categoryOptions.value = [];
      categories.value = [];
      topButtons.value = [];
    }
  }
  catch (error) {
    console.error('ËºâÂÖ•?ÜÈ??óË°®Â§±Ê?:', error);
    console.error('?ØË™§Ë©≥Ê?:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    });
    message.error('ËºâÂÖ•?ÜÈ??óË°®Â§±Ê?');
    categoryOptions.value = [];
    categories.value = [];
    topButtons.value = [];
  }
}

// ?†Ë??áÁ??óË°®
async function loadPosts() {
  try {
    console.log('?ãÂ??†Ë??áÁ??óË°®...');
    isLoading.value = true;

    const headers = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('access_token');
    if (token)
      headers.Authorization = `Bearer ${token}`;

    const response = await axios.get('http://localhost:8000/api/public/posts/', { headers });

    console.log('?áÁ??óË°®?øÊ?:', response.data);

    if (Array.isArray(response.data)) {
      posts.value = response.data.map((post: any) => ({
        id: post.id || 0,
        title: post.title || '',
        content: post.content || '',
        category_id: post.category?.id || null,
        category: {
          id: post.category?.id || null,
          name: post.category?.name || '?™Áü•?ÜÈ?',
        },
        author: {
          id: post.author?.id || 0,
          username: post.author?.username || '?øÂ??®Êà∂',
          avatar: getAuthorAvatar(post.author),
        },
        created_at: post.created_at || new Date().toISOString(),
        views: post.views || 0,
        likes_count: post.like_count || 0,
        comments_count: post.comment_count || 0,
        tags: Array.isArray(post.tags)
          ? post.tags.map(tag => ({
            id: tag.id,
            name: tag.name,
            description: tag.description || '',
          }))
          : [],
        is_liked: post.is_liked || false,
      }));
      console.log('?¥Êñ∞ÂæåÁ??áÁ??óË°®:', posts.value);
    }
    else {
      console.error('?°Ê??ÑÈüø?âÊ†ºÂº?', response.data);
      posts.value = [];
    }
  }
  catch (error: any) {
    console.error('?†Ë??áÁ??óË°®Â§±Ê?:', error);
    posts.value = [];
    message.error(error.response?.data?.message || '?†Ë??áÁ??óË°®Â§±Ê?ÔºåË?Á®çÂ??çË©¶');
  }
  finally {
    isLoading.value = false;
  }
}

// ?†Ë?Ê®ôÁ±§?óË°®
async function loadTags() {
  try {
    console.log('?ãÂ?ËºâÂÖ•Ê®ôÁ±§?óË°®...');
    const response = await axios.get('http://localhost:8000/api/public/tags/', {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Ê®ôÁ±§API?øÊ?:', response.data);

    if (Array.isArray(response.data)) {
      tags.value = response.data.map(tag => ({
        label: tag.name,
        value: tag.id,
        description: tag.description || '',
      }));
      console.log('?ïÁ?ÂæåÁ?Ê®ôÁ±§?∏Ê?:', tags.value);
    }
    else {
      console.error('Ê®ôÁ±§?∏Ê??ºÂ?‰∏çÊ≠£Á¢?', response.data);
      tags.value = [];
    }
  }
  catch (error) {
    console.error('ËºâÂÖ•Ê®ôÁ±§?óË°®Â§±Ê?:', error);
    message.error('ËºâÂÖ•Ê®ôÁ±§?óË°®Â§±Ê?');
    tags.value = [];
  }
}

// ?§Êñ∑?ØÂê¶?∫Êñ∞?áÁ?Ôº?4Â∞èÊ??ßÔ?`n
// ?ºÂ??ñÊó•??function formatDate(date) {
  return new Date(date).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ?ºÊ?Ë°®ÂñÆ
const showPostModal = ref(false);
const postForm = ref({
  category_id: null,
  title: '',
  content: '',
  tags: [],
  is_public: true,
  allow_comments: true,
});

// ?çÁΩÆË°®ÂñÆ
function resetForm() {
  postForm.value = {
    category_id: null,
    title: '',
    content: '',
    tags: [],
    is_public: true,
    allow_comments: true,
  };
  selectedTags.value = [];
}

// Ë°®ÂñÆÈ©óË?Ë¶èÂ?
const rules = {
  category_id: {
    required: true,
    type: 'number',
    message: 'Ë´ãÈÅ∏?áÊ?Á´†Â?È°?,
    trigger: ['blur', 'change', 'input'],
  },
  title: {
    required: true,
    message: 'Ë´ãËº∏?•Ê?Á´†Ê?È°?,
    trigger: ['blur', 'input'],
    min: 2,
    max: 100,
  },
  content: {
    required: true,
    message: 'Ë´ãËº∏?•Ê?Á´†ÂÖßÂÆ?,
    trigger: ['blur', 'input'],
    min: 10,
  },
};

// ?Ä??const isSubmitting = ref(false);
const showLoginModal = ref(false);

// ?≤Â??ÜÈ??çÁ®±`n
// ??ÅΩ?ªÂÖ•?Ä?ãË???watch(isLoggedIn, async (newValue) => {
  if (!newValue) {
    try {
      // ?ºÂè´ÂæåÁ´Ø?ªÂá∫ API
      const token = localStorage.getItem('access_token');
      if (token) {
        await axios.post('http://localhost:8000/api/auth/logout/', null, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      // Ê∏ÖÈô§?¨Âú∞Â≠òÂÑ≤?åÁ???      localStorage.clear();
      userStore.setLoginStatus(false);
      userStore.clearUserInfo();
      message.success('Â∑≤Áôª?∫Á≥ªÁµ?);

      // ?çÊñ∞?†Ë??áÁ??óË°®Ôºà‰??ÄË¶ÅË?Ë≠âÔ?
      await loadPosts();

      router.push('/login');
    }
    catch (error) {
      console.error('?ªÂá∫?ØË™§:', error);
      // ?≥‰ΩøÂæåÁ´Ø API ?ºÂè´Â§±Ê?Ôºå‰??∂Ê??§Êú¨?∞Êï∏??      localStorage.clear();
      userStore.setLoginStatus(false);
      userStore.clearUserInfo();
      message.warning('?ªÂá∫?ÇÁôº?üÈåØË™§Ô?‰ΩÜÂ∑≤Ê∏ÖÈô§?¨Âú∞?ªÂÖ•?Ä??);

      // ?çÊñ∞?†Ë??áÁ??óË°®Ôºà‰??ÄË¶ÅË?Ë≠âÔ?
      await loadPosts();

      router.push('/login');
    }
  }
  else {
    // ?çÊñ∞?†Ë??∏Ê?
    await loadCategories();
    await loadPosts();
    await loadTags();
  }
});

// ?ê‰∫§Ë°®ÂñÆ
async function handleSubmit() {
  try {
    isSubmitting.value = true;

    // Ê™¢Êü•?ªÂÖ•?Ä??    if (!isLoggedIn.value) {
      message.error('Ë´ãÂ??ªÂÖ•');
      showLoginModal.value = true;
      isSubmitting.value = false;
      return;
    }

    // ?≤Â? token
    const token = localStorage.getItem('access_token');
    if (!token) {
      message.error('?ªÂÖ•Â∑≤È??üÔ?Ë´ãÈ??∞Áôª??);
      showLoginModal.value = true;
      isSubmitting.value = false;
      return;
    }

    // Ê∫ñÂ??ºÈÄÅÁ??∏Ê?
    const response = await axios.post(
      'http://localhost:8000/api/public/posts/',
      {
        title: postForm.value.title.trim(),
        content: postForm.value.content.trim(),
        category_id: Number(postForm.value.category_id),
        tags_ids: selectedTags.value, // ‰øÆÊîπÊ¨Ñ‰??çÁ®±
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      },
    );

    console.log('API ?øÊ?:', response.data);

    if (response.data && response.data.data) {
      message.success('?ºÊ??êÂ?');
      showPostModal.value = false;
      resetForm();
      // Âª∂ÈÅ≤‰∏Ä‰∏ãÂ??çÊñ∞?†Ë??áÁ??óË°®
      setTimeout(async () => {
        await loadPosts();
      }, 500);
    }
    else {
      throw new Error(response.data.message || '?ºÊ?Â§±Ê?');
    }
  }
  catch (error) {
    console.error('?ºÊ??ØË™§:', error);
    if (error.response) {
      const errorMessage = error.response.data.message || error.response.data.detail || '?ºÊ?Â§±Ê?';
      message.error(errorMessage);
      console.error('API ?ØË™§Ë©≥Ê?:', error.response.data);
    }
    else {
      message.error(error.message || '?ºÊ?Â§±Ê?ÔºåË?Á®çÂ??çË©¶');
    }
  }
  finally {
    isSubmitting.value = false;
  }
}

// ?®Á?‰ª∂Ê?ËºâÊ??†Ë??∏Ê?
onMounted(async () => {
  await loadCategories();
  await loadPosts();
  await loadTags();
  await loadModerators();
});

// Ëº™Êí≠?ñÁ??óË°®
const carouselImages = [
  {
    url: 'https://images.pexels.com/photos/5059013/pexels-photo-5059013.jpeg',
    title: '?øÈ?Â±±Êó•??,
    description: '?≤Êµ∑?ÅÊ£Æ?óÈêµË∑ØË??®Êõ¶Ôºå‰ª§‰∫∫ÂöÆÂæÄ?ÑÊó•?∫Â???,
  },
  {
    url: 'https://images.pexels.com/photos/2478248/pexels-photo-2478248.jpeg',
    title: '?∞Â?101',
    description: '?∞ÁÅ£?∞Ê??ßÂª∫ÁØâÔ?Ë±°ÂæµÁ∂ìÊ?ÁπÅÊ¶Æ?áÈÄ≤Ê≠•',
  },
  {
    url: 'https://images.pexels.com/photos/5824901/pexels-photo-5824901.jpeg',
    title: 'Â§™È≠Ø???ÂÆ∂ÂÖ¨??,
    description: 'Â£ØÈ??ÑÂ≥ΩË∞∑Ë?Ê∏ÖÊ?Ê∫™Ê?ÔºåÂè∞????óÂ??ÑÂ?ÂÆ∂ÂÖ¨??,
  },
  {
    url: 'https://images.pexels.com/photos/5827881/pexels-photo-5827881.jpeg',
    title: '?•Ê?ÊΩ≠È¢®??,
    description: '?∞ÁÅ£?ÄÂ§ßÁ?Â§©ÁÑ∂ÊπñÊ?ÔºåÂ±±Ê∞¥Áõ∏?†Á??™ÁÑ∂ÁæéÊôØ',
  },
  {
    url: 'https://images.pexels.com/photos/5827896/pexels-photo-5827896.jpeg',
    title: '‰πù‰ªΩ?ÅË?',
    description: '?ÖÊªø?∑Ë?Ê∞õÂ??ÑÂ±±?éÔ?Â±ïÁèæ?∞ÁÅ£?≥Áµ±?áÂ?',
  },
  {
    url: 'https://images.pexels.com/photos/1835927/pexels-photo-1835927.jpeg',
    title: 'Â¢æ‰?Êµ∑Á?',
    description: '?ΩÂ??ÅÊ??òË?Á¢ßÊµ∑ÔºåÂè∞????óÁ´Ø?ÑÂ∫¶?áÂ§©??,
  },
  {
    url: 'https://images.pexels.com/photos/5827912/pexels-photo-5827912.jpeg',
    title: '?ΩÊ?Â±±Â?ÂÆ∂ÂÖ¨??,
    description: 'Ê∫´Ê??áËä±Â≠??Â§©Â?ÔºåÂè∞?óÂ??±Â?',
  },
  {
    url: 'https://images.pexels.com/photos/5827920/pexels-photo-5827920.jpeg',
    title: 'Ê∏ÖÂ?Ëæ≤Â†¥',
    description: '?íÈ??âÂ??áÁ∂øÁæäÁæ§ÔºåÂè∞???Â∞èÁ?Â£?,
  },
];

// Ë∑≥Ë??∞Ê?Á´†Ë©≥?ÖÈ?
const showPostDetailModal = ref(false);
const selectedPost = ref(null);

function goToPostDetail(post) {
  selectedPost.value = post;
  showPostDetailModal.value = true;
}

// ?úÂ??úÈçµÂ≠?const searchKeyword = ref('');

// ?íÂ??∏È?
const sortOptions = [
  { label: '?Ä?∞ÁôºÂ∏?, value: 'newest' },
  { label: '?ÄÂ§öË???, value: 'most-viewed' },
  { label: '?ÄÂ§öÂ?Ë¶?, value: 'most-replied' },
  { label: '?ÄÂ§öÂ?Ê≠?, value: 'most-liked' },
];
const currentSort = ref('newest');

// ÁØ©ÈÅ∏?∏È?
const filterOptions = ref({
  dateRange: null,
  category: null,
  author: null,
});

// ?ïÁ??úÂ?`n
// ?ïÁ??íÂ?`n
// ?ïÁ?ÁØ©ÈÅ∏
function handleFilter() {
  // TODO: ÂØ¶‰?ÁØ©ÈÅ∏?èËºØ
  console.log('ÁØ©ÈÅ∏Ê¢ù‰ª∂:', filterOptions.value);
}

// ?ïÁ??ºÊ??âÈ?ÈªûÊ?
function handlePostButtonClick() {
  if (!isLoggedIn.value) {
    showLoginModal.value = true;
    return;
  }
  showPostModal.value = true;
}

// Ë∑≥Ë??∞Ë®ª?äÈ???function goToRegister() {
  router.push('/register');
  showLoginModal.value = false;
}

// ??script setup ?ÄÂ°äÁ??ãÈ†≠Ê∑ªÂ??∞Á? ref
const moderators = ref([]);

// ??script setup ?ÄÂ°ä‰∏≠Ê∑ªÂ??∞Á??ΩÊï∏
async function loadModerators() {
  try {
    console.log('?ãÂ?ËºâÂÖ•?àÂ?‰∫∫Âì°Ë≥áË?...');
    const response = await axios.get('http://localhost:8000/api/forum/moderators/', {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('?àÂ?‰∫∫Âì°Ë≥áË??øÊ?:', response.data);

    if (response.data?.status === 'success' && Array.isArray(response.data.data)) {
      moderators.value = response.data.data.map(mod => ({
        ...mod,
        avatar: mod.avatar
          ? getAuthorAvatar(mod)
          : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
      }));
    }
    else {
      console.error('?°Ê??ÑÁ??ô‰∫∫?°Ë??ôÊ†ºÂº?', response.data);
      moderators.value = [];
    }
  }
  catch (error) {
    console.error('ËºâÂÖ•?àÂ?‰∫∫Âì°Ë≥áË?Â§±Ê?:', error);
    moderators.value = [];
  }
}

// ?ïÁ??âË?`n</script>

<template>
  <main class="bg-gradient-to-b from-gray-50 to-white min-h-screen">
    <!-- Ëº™Êí≠Banner -->
    <div class="relative h-[400px]">
      <NCarousel
        autoplay
        :interval="5000"
        dot-type="line"
        effect="fade"
        class="h-full"
      >
        <div
          v-for="(image, index) in carouselImages"
          :key="index"
          class="h-full relative"
        >
          <img
            :src="image.url"
            :alt="image.title"
            class="w-full h-full object-cover"
          >
          <div class="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div class="text-center text-white">
              <h1 class="text-4xl font-bold mb-4">
                {{ title }}
              </h1>
              <p class="text-xl opacity-90">
                ?Ü‰∫´?®Á??ÖÈ?Á∂ìÈ?
              </p>
            </div>
          </div>
        </div>
      </NCarousel>
    </div>

    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- ?ÇÈÉ®?ÜÈ??âÈ? -->
      <div class="flex flex-wrap gap-3 mb-8">
        <NButton
          v-for="btn in topButtons"
          :key="btn"
          :type="activeCategory === btn ? 'primary' : 'default'"
          secondary
          class="!rounded-full px-6 transition-all duration-300 hover:transform hover:scale-105"
          :class="{ 'shadow-md': activeCategory === btn }"
          @click="activeCategory = btn"
        >
          {{ btn }}
        </NButton>
      </div>

      <div class="flex flex-col lg:flex-row gap-6">
        <!-- Â∑¶ÂÅ¥?ÜÈ??óË°® -->
        <div class="w-full lg:w-64 flex-shrink-0">
          <div class="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-5">
            <h3 class="font-semibold text-gray-800 mb-4 text-lg flex items-center gap-2">
              <NIcon size="20">
                <CategoryOutlined />
              </NIcon>
              Ë®éË??ÜÈ?
            </h3>
            <ul class="space-y-2.5">
              <li v-for="category in categoryOptions" :key="category.value">
                <a
                  href="#"
                  class="flex items-center justify-between p-3 rounded-lg transition-all duration-300"
                  :class="{
                    'bg-primary/5 text-primary font-medium': category.value === postForm.category_id,
                    'text-gray-600 hover:bg-gray-50': category.value !== postForm.category_id,
                  }"
                  @click.prevent="postForm.category_id = category.value"
                >
                  <span>{{ category.label }}</span>
                  <span
                    class="px-2.5 py-1 rounded-full text-xs" :class="{
                      'bg-primary/10 text-primary': category.value === postForm.category_id,
                      'bg-gray-100 text-gray-500': category.value !== postForm.category_id,
                    }"
                  >{{ category.post_count }}</span>
                </a>
              </li>
            </ul>
          </div>

          <!-- Âø´ÈÄüÂ?Ë¶?-->
          <div class="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-5 mt-6">
            <h3 class="font-semibold text-gray-800 mb-4 text-lg flex items-center gap-2">
              <NIcon size="20">
                <NavigateNextOutlined />
              </NIcon>
              Âø´ÈÄüÂ?Ë¶?            </h3>
            <div class="space-y-2 text-sm text-gray-600">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-green-500" />
                <span>?êÈ?Ë®ò„ÄëÂ?‰∫´Ê??äÈ?È©?/span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-blue-500" />
                <span>?êË??É„ÄëË?Á®ãË??ÉË?Ë´?/span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-yellow-500" />
                <span>?êÂ?‰∫´„ÄëÊôØÈªûÁ?È£üÊé®??/span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-purple-500" />
                <span>?êÈ??ä„ÄëË?È¨ÜË©±È°å‰∫§Êµ?/span>
              </div>
            </div>
          </div>
        </div>

        <!-- ‰∏≠È?‰∏ªË??ßÂÆπ?Ä -->
        <div class="flex-1">
          <div class="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <!-- ?üËÉΩ?âÈ??Ä -->
            <div class="border-b border-gray-100 p-5">
              <div class="flex flex-col gap-4">
                <!-- ?úÂ??åÊ?Â∫èÂ? -->
                <div class="flex items-center justify-between">
                  <div class="flex gap-3 flex-1">
                    <NInput
                      v-model:value="searchKeyword"
                      placeholder="?úÂ??áÁ?..."
                      class="max-w-xs"
                    >
                      <template #prefix>
                        <NIcon><SearchOutlined /></NIcon>
                      </template>
                    </NInput>
                    <NSelect
                      v-model:value="currentSort"
                      :options="sortOptions"
                      class="w-32"
                    >
                      <template #prefix>
                        <NIcon><SortOutlined /></NIcon>
                      </template>
                    </NSelect>
                  </div>
                  <NButton type="primary" secondary class="rounded-full px-6" strong @click="handlePostButtonClick">
                    <div class="flex items-center gap-2">
                      <NIcon><AddOutlined /></NIcon>
                      ?ºË°®?∞‰∏ªÈ°?                    </div>
                  </NButton>
                </div>

                <!-- ÁØ©ÈÅ∏?Ä -->
                <div class="flex items-center gap-4">
                  <NDatePicker
                    v-model:value="filterOptions.dateRange"
                    type="daterange"
                    clearable
                    class="w-64"
                    placeholder="?∏Ê??•Ê?ÁØÑÂ?"
                  />
                  <NSelect
                    v-model:value="filterOptions.category"
                    :options="categories.map(c => ({ label: c.name, value: c.name }))"
                    placeholder="?∏Ê??ÜÈ?"
                    clearable
                    class="w-32"
                  />
                  <NButton size="small" class="rounded-full px-5" @click="handleFilter">
                    <template #icon>
                      <NIcon><FilterAltOutlined /></NIcon>
                    </template>
                    ÁØ©ÈÅ∏
                  </NButton>
                </div>
              </div>
            </div>

            <!-- ?áÁ??óË°® -->
            <div class="bg-white rounded-lg p-4">
              <div v-if="!posts || posts.length === 0" class="text-gray-500 text-center py-4">
                ?´ÁÑ°?áÁ?
              </div>
              <div v-else class="divide-y divide-gray-100">
                <div
                  v-for="post in posts" :key="post.id"
                  class="py-4 hover:bg-gray-50 transition-all duration-300 cursor-pointer"
                  @click="goToPostDetail(post)"
                >
                  <div class="flex items-start space-x-3">
                    <div class="flex-1">
                      <div class="flex items-center space-x-2 mb-2">
                        <img
                          :src="getAuthorAvatar(post.author)"
                          :alt="post.author.username"
                          class="w-6 h-6 rounded-full object-cover"
                          @error="(e) => e.target.src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'"
                        >
                        <span class="text-sm text-gray-600">{{ post.author.username }}</span>
                        <span class="text-gray-400">¬∑</span>
                        <span class="text-sm text-gray-500">{{ formatDate(post.created_at) }}</span>
                      </div>
                      <h3 class="text-lg font-medium text-gray-900 hover:text-primary mb-2">
                        {{ post.title }}
                      </h3>
                      <div class="flex items-center space-x-4 text-sm text-gray-500">
                        <span class="flex items-center space-x-1">
                          <NIcon size="16"><VisibilityOutlined /></NIcon>
                          <span>{{ post.views }}</span>
                        </span>
                        <span class="flex items-center space-x-1">
                          <NIcon size="16">
                            <component :is="post.is_liked ? FavoriteOutlined : FavoriteBorderOutlined" />
                          </NIcon>
                          <span>{{ post.likes_count }}</span>
                        </span>
                        <span class="flex items-center space-x-1">
                          <NIcon size="16"><ChatBubbleOutlined /></NIcon>
                          <span>{{ post.comments_count }}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- ?ÜÈ? -->
            <div class="p-5 border-t border-gray-100">
              <div class="flex justify-between items-center">
                <div class="flex gap-2">
                  <NButton size="small" type="primary" class="rounded-lg min-w-[32px]">
                    1
                  </NButton>
                  <NButton size="small" class="rounded-lg min-w-[32px]">
                    2
                  </NButton>
                  <NButton size="small" class="rounded-lg min-w-[32px]">
                    3
                  </NButton>
                  <NButton size="small" class="rounded-lg min-w-[32px]">
                    4
                  </NButton>
                  <span class="w-8 h-8 flex items-center justify-center text-gray-400">...</span>
                  <NButton size="small" class="rounded-lg min-w-[32px]">
                    42
                  </NButton>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ?≥ÂÅ¥‰ø°ÊÅØÊ¨?-->
        <div class="w-full lg:w-80 flex-shrink-0 space-y-6">
          <!-- ?àÂ?‰∫∫Âì° -->
          <div class="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-5">
            <h3 class="font-semibold text-gray-800 mb-4 text-lg flex items-center gap-2">
              <NIcon size="20">
                <PersonOutlined />
              </NIcon>
              ?àÂ?‰∫∫Âì°
            </h3>
            <div class="space-y-4">
              <template v-if="moderators.length > 0">
                <div
                  v-for="moderator in moderators" :key="moderator.id"
                  class="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-300"
                >
                  <div class="relative">
                    <img
                      :src="moderator.avatar"
                      :alt="moderator.username"
                      class="w-12 h-12 rounded-full object-cover ring-2 shadow-sm"
                      :class="moderator.status === '?®Á?' ? 'ring-green-500' : 'ring-gray-300'"
                      @error="(e) => e.target.src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'"
                    >
                    <span
                      class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
                      :class="moderator.status === '?®Á?' ? 'bg-green-500' : 'bg-gray-400'"
                    />
                  </div>
                  <div>
                    <div class="font-medium text-gray-800">
                      {{ moderator.username }}
                    </div>
                    <div class="text-sm text-gray-500 mt-0.5">
                      <span class="inline-flex items-center gap-1">
                        <span
                          class="w-1.5 h-1.5 rounded-full"
                          :class="moderator.status === '?®Á?' ? 'bg-green-500' : 'bg-gray-400'"
                        />
                        {{ moderator.status }}
                      </span>
                    </div>
                  </div>
                </div>
              </template>
              <div v-else class="text-center text-gray-500 py-4">
                ?´ÁÑ°?àÂ?‰∫∫Âì°
              </div>
            </div>
          </div>

          <!-- Ê¥ªË?‰ΩúËÄ?-->
          <div class="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-5">
            <h3 class="font-semibold text-gray-800 mb-4 text-lg flex items-center gap-2">
              <NIcon size="20">
                <GroupsOutlined />
              </NIcon>
              ?¨Á?ËøëÊ?Ê¥ªË?‰ΩúËÄ?            </h3>
            <div class="space-y-5">
              <div v-for="author in activeAuthors" :key="author.name" class="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-300">
                <img :src="author.avatar" :alt="author.name" class="w-12 h-12 rounded-full ring-2 ring-gray-100">
                <div>
                  <div class="font-medium text-gray-800">
                    {{ author.name }}
                  </div>
                  <div class="text-sm text-gray-500 mt-0.5">
                    {{ author.title }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ?±È?Ê®ôÁ±§ -->
          <div class="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-5">
            <h3 class="font-semibold text-gray-800 mb-4 text-lg flex items-center gap-2">
              <NIcon size="20">
                <LocalOfferOutlined />
              </NIcon>
              ?±È?Ê®ôÁ±§
            </h3>
            <div class="flex flex-wrap gap-2">
              <span class="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200 cursor-pointer transition-colors duration-300">#?∞Â?ÁæéÈ?</span>
              <span class="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200 cursor-pointer transition-colors duration-300">#?∞Â≥∂?ÖË?</span>
              <span class="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200 cursor-pointer transition-colors duration-300">#?±ËìÆ?ØÈ?</span>
              <span class="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200 cursor-pointer transition-colors duration-300">#Ë¶™Â???/span>
              <span class="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200 cursor-pointer transition-colors duration-300">#?™Áî±Ë°?/span>
              <span class="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200 cursor-pointer transition-colors duration-300">#‰ΩèÂÆø?®Ëñ¶</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- ?ºÊ?ÂΩàÁ? -->
  <NModal v-model:show="showPostModal" style="width: 800px">
    <NCard
      title="?ºË°®?∞‰∏ªÈ°?
      :bordered="false"
      size="huge"
      role="dialog"
      aria-modal="true"
    >
      <NForm ref="formRef" :model="postForm" :rules="rules">
        <NFormItem label="?áÁ??ÜÈ?" path="category_id" required>
          <NSelect
            v-model:value="postForm.category_id"
            :options="categoryOptions"
            placeholder="Ë´ãÈÅ∏?áÂ?È°?
            :disabled="isSubmitting"
            @update:value="(val) => {
              console.log('?∏Ê??ÑÂ?È°ûÂÄ?', val);
              if (!val) {
                postForm.category_id = null;
                message.warning('Ë´ãÈÅ∏?áÊ?Á´†Â?È°?);
                return;
              }
              const selectedCategory = categoryOptions.value.find(cat => cat.value === val);
              if (selectedCategory) {
                postForm.category_id = val;
                message.success(`Â∑≤ÈÅ∏?áÂ?È°? ${selectedCategory.label}`);
              }
              else {
                postForm.category_id = null;
                message.error('?°Ê??ÑÂ?È°ûÈÅ∏??);
              }
            }"
          />
        </NFormItem>
        <NFormItem label="?áÁ?Ê®ôÈ?" path="title" required>
          <NInput
            v-model:value="postForm.title"
            placeholder="Ë´ãËº∏?•Ê?È°åÔ?2-100Â≠óÔ?"
            :maxlength="100"
            show-count
          />
        </NFormItem>
        <NFormItem label="?áÁ??ßÂÆπ" path="content" required>
          <NInput
            v-model:value="postForm.content"
            type="textarea"
            placeholder="Ë´ãËº∏?•ÂÖßÂÆπÔ??≥Â?10Â≠óÔ?"
            :rows="10"
            show-count
          />
        </NFormItem>
        <NFormItem label="Ê®ôÁ±§" path="tags">
          <NSelect
            v-model:value="selectedTags"
            :options="tags"
            multiple
            placeholder="Ë´ãÈÅ∏?áÊ?Á±?
            :disabled="isSubmitting"
            @update:value="(val) => {
              console.log('?∏Ê??ÑÊ?Á±?', val);
              selectedTags.value = val;
            }"
          />
        </NFormItem>
        <NFormItem label="?áÁ?Ë®≠Â?">
          <div class="space-y-2">
            <NSwitch v-model:value="postForm.is_public">
              <template #checked>
                ?¨È?
              </template>
              <template #unchecked>
                ÁßÅÂ?
              </template>
            </NSwitch>
            <NSwitch v-model:value="postForm.allow_comments">
              <template #checked>
                ?ÅË®±Ë©ïË?
              </template>
              <template #unchecked>
                Á¶ÅÊ≠¢Ë©ïË?
              </template>
            </NSwitch>
          </div>
        </NFormItem>
      </NForm>
      <template #footer>
        <div class="flex justify-end gap-4">
          <NButton @click="showPostModal = false">
            ?ñÊ?
          </NButton>
          <NButton
            type="primary"
            :loading="isSubmitting"
            :disabled="!postForm.category_id || !postForm.title.trim() || !postForm.content.trim()"
            @click="handleSubmit"
          >
            ?ºË°®?áÁ?
          </NButton>
        </div>
      </template>
    </NCard>
  </NModal>

  <!-- ?ªÂÖ•?êÁ§∫ÂΩàÁ? -->
  <NModal v-model:show="showLoginModal" style="width: 400px">
    <NCard
      title="?ÄË¶ÅË®ª??
      :bordered="false"
      size="huge"
      role="dialog"
      aria-modal="true"
    >
      <div class="text-center">
        <p class="mb-6">
          ?ºË°®?áÁ??ÄË¶ÅÂ?Ë®ªÂ??êÁÇ∫?ÉÂì°
        </p>
        <div class="flex justify-center gap-4">
          <NButton type="primary" @click="goToRegister">
            Á´ãÂç≥Ë®ªÂ?
          </NButton>
          <NButton @click="showLoginModal = false">
            ?ñÊ?
          </NButton>
        </div>
      </div>
    </NCard>
  </NModal>

  <PostDetailModal
    v-model:show="showPostDetailModal"
    :post="selectedPost"
    @like="(data) => {
      if (selectedPost) {
        selectedPost.is_liked = data.is_liked
        selectedPost.like_count = data.like_count
      }
      // ?¥Êñ∞?óË°®‰∏≠Á??áÁ??∏Ê?
      const list = Array.isArray(posts?.value) ? posts.value : []
      const currentId = selectedPost?.id
      if (currentId) {
        const postIndex = list.findIndex(p => p?.id === currentId)
        if (postIndex !== -1) {
          list[postIndex].is_liked = data.is_liked
          list[postIndex].like_count = data.like_count
        }
      }
    }"
    @comment="(data) => {
      const normalized = normalizeComment(data)
      if (selectedPost && normalized) {
        selectedPost.comment_count = (selectedPost.comment_count || 0) + 1
        selectedPost.comments = [...(selectedPost.comments || []), normalized]
      }
      // ?¥Êñ∞?óË°®‰∏≠Á??áÁ??∏Ê?
      const list = Array.isArray(posts?.value) ? posts.value : []
      const currentId = selectedPost?.id
      if (currentId) {
        const postIndex = list.findIndex(p => p?.id === currentId)
        if (postIndex !== -1) {
          list[postIndex].comment_count = (list[postIndex].comment_count || 0) + 1
        }
      }
    }"
  />
</template>

<style scoped>
.text-primary {
  color: var(--primary-color);
}

.bg-primary {
  background-color: var(--primary-color);
}

.border-primary {
  border-color: var(--primary-color);
}

.hover\:text-primary:hover {
  color: var(--primary-color);
}

.hover\:bg-primary:hover {
  background-color: var(--primary-color);
}

.ring-primary {
  --tw-ring-color: var(--primary-color);
}

/* ?™Â?Áæ©Êº∏ËÆäË???*/
.bg-primary\/5 {
  background-color: rgba(var(--primary-color-rgb), 0.05);
}

.bg-primary\/10 {
  background-color: rgba(var(--primary-color-rgb), 0.1);
}

/* Ê∑ªÂ?Âπ≥Ê??éÊ∏°?àÊ? */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}

/* ?°Á??∏ÊµÆ?àÊ? */
.hover\:shadow-md {
  --tw-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}

/* ?ìË??âÈ?Ê®?? */
.rounded-full {
  border-radius: 9999px;
}

/* Ê®ôÁ±§Ê®?? */
.rounded-lg {
  border-radius: 0.5rem;
}
</style>

