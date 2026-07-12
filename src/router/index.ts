import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'mainMenu',
      component: () => import('../views/MainMenuView.vue'),
    },
    {
      path: '/note-practice',
      name: 'notePractice',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/practice',
      name: 'practice',
      component: () => import('../views/PracticeView.vue'),
    },
    {
      path: '/melody',
      name: 'melodyHome',
      component: () => import('../views/MelodyHomeView.vue'),
    },
    {
      path: '/melody/practice',
      name: 'melodyPractice',
      component: () => import('../views/PracticeView.vue'),
    },
    {
      path: '/note-name-practice',
      name: 'noteNamePractice',
      component: () => import('../views/NoteNamePracticeView.vue'),
    },
    {
      path: '/rhythm',
      name: 'rhythmHome',
      component: () => import('../views/RhythmHomeView.vue'),
    },
    {
      path: '/rhythm/practice',
      name: 'rhythmPractice',
      component: () => import('../views/RhythmPracticeView.vue'),
    },
    {
      path: '/metronome',
      name: 'metronome',
      component: () => import('../views/MetronomeView.vue'),
    },
    {
      path: '/wrong-book',
      name: 'wrongBook',
      component: () => import('../views/WrongBookView.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
    },
  ],
})

export default router
