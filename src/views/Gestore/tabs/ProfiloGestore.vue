<template>
    <ion-page>
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>Profilo</ion-title>
        </ion-toolbar>
      </ion-header>
  
      <ion-content>
        <div class="div-button">
    
          <ion-button class="button" router-link="/cliente/tabs/tab3/visualizzaProfilo" router-direction="forward">
          Visualizza profilo
        </ion-button>
          
          <ion-button class="button-logout" @click="logout">Logout</ion-button>
      </div>
      </ion-content>
    </ion-page>
  </template>
  
  <script setup lang="ts">
  import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent,IonButton } from '@ionic/vue';
  import { getAuth, signOut } from "firebase/auth";
  import { useRouter } from 'vue-router';
  
  const router = useRouter();
  
  const auth = getAuth();
  
  
  const logout= async ()=>{
  
    signOut(auth).then(() => {
      router.replace('/login');
  }).catch((error) => {
    // An error happened.
  });
  }
  </script>
  
  <style>
  
    .div-button{
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .button{
      margin-top: 40px;
      height: 50px;
    }
  
  </style>