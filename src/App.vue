<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';

// Importa Firebase e Capacitor
import { Capacitor } from '@capacitor/core';
import { initializeApp } from 'firebase/app';
import { indexedDBLocalPersistence, initializeAuth } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";
import { SplashScreen } from '@capacitor/splash-screen';



import { onMounted,onBeforeMount } from 'vue';




const firebaseConfig = {
  firebase:{
    apiKey: "AIzaSyAoeVM4luCHr8Irz-_K1E1aOLQP-2iV858",
    authDomain: "appuntamentiv2.firebaseapp.com",
    projectId: "appuntamentiv2",
    storageBucket: "appuntamentiv2.appspot.com",
    messagingSenderId: "175265749386",
    appId: "1:175265749386:web:ae0cd78f912a9dc9041073",
    measurementId: "G-8239522FZR"
  },
  };

// Lifecycle hook per eseguire codice al montaggio del componente
  // Inizializza Firebase
  const app = initializeApp(firebaseConfig.firebase);



  // Controlla se è una piattaforma nativa usando Capacitor
  if (Capacitor.isNativePlatform()) {
    initializeAuth(app, {
      persistence: indexedDBLocalPersistence,
    });
  }



  
</script>

<style scoped>
/* Aggiungi qui gli stili personalizzati, se necessario */
</style>
